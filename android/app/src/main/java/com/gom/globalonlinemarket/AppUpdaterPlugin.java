package com.gom.globalonlinemarket;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;
import androidx.core.content.pm.PackageInfoCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

/**
 * Native Capacitor plugin for verified, in-place Android APK updates.
 *
 * Security controls enforced natively:
 * - Strict HTTPS-only downloads from allowlisted release hosts (re-validated on every redirect hop).
 * - Sanitized filename and canonical path confinement inside app-private cache/updates/.
 * - Constant-time SHA-256 integrity verification via MessageDigest.isEqual.
 * - Package name match, non-downgrade versionCode check, and signing certificate SHA-256 match
 *   against the currently installed application before invoking Android's system installer.
 */
@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    private static final int CONNECT_TIMEOUT_MS = 15_000;
    private static final int READ_TIMEOUT_MS = 30_000;
    private static final int MAX_REDIRECTS = 5;
    private static final long MAX_APK_BYTES = 250L * 1024L * 1024L; // 250 MB safety cap
    private static final Pattern SAFE_APK_NAME = Pattern.compile("^[A-Za-z0-9._-]+\\.apk$");
    private static final Pattern HEX_SHA256 = Pattern.compile("^[a-fA-F0-9]{64}$");

    private static final Set<String> ALLOWED_DOWNLOAD_HOSTS = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList(
                    "github.com",
                    "objects.githubusercontent.com",
                    "release-assets.githubusercontent.com",
                    "github-releases.githubusercontent.com",
                    "codeload.github.com"
            ))
    );

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final AtomicBoolean isDownloading = new AtomicBoolean(false);
    private final AtomicBoolean cancelRequested = new AtomicBoolean(false);

    private volatile File pendingVerifiedApk = null;
    private volatile String pendingVerifiedSha256 = null;
    private volatile long pendingExpectedVersionCode = 0L;

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        try {
            Context context = getContext();
            PackageManager pm = context.getPackageManager();
            String pkgName = context.getPackageName();
            PackageInfo info = getInstalledPackageInfo(pm, pkgName, 0);

            String appName = context.getApplicationInfo().loadLabel(pm).toString();
            String versionName = info.versionName != null ? info.versionName : BuildConfig.VERSION_NAME;
            long versionCode = PackageInfoCompat.getLongVersionCode(info);

            JSObject result = new JSObject();
            result.put("packageName", pkgName);
            result.put("appName", appName);
            result.put("versionName", versionName);
            result.put("versionCode", versionCode);
            result.put("updateRepo", BuildConfig.GITHUB_UPDATE_REPO != null ? BuildConfig.GITHUB_UPDATE_REPO : "");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Unable to read installed app information.");
        }
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasInstallPermission());
        call.resolve(result);
    }

    @PluginMethod
    public void openUnknownSourcesSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Context context = getContext();
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Unable to open Android installation settings.");
        }
    }

    @PluginMethod
    public void cancelDownload(PluginCall call) {
        cancelRequested.set(true);
        JSObject result = new JSObject();
        result.put("cancelled", true);
        call.resolve(result);
    }

    @PluginMethod
    public void installPendingUpdate(PluginCall call) {
        File apkFile = pendingVerifiedApk;
        String expectedSha = pendingVerifiedSha256;
        long expectedCode = pendingExpectedVersionCode;

        if (apkFile == null || !apkFile.exists() || expectedSha == null) {
            JSObject result = new JSObject();
            result.put("status", "none");
            call.resolve(result);
            return;
        }

        if (!hasInstallPermission()) {
            JSObject result = new JSObject();
            result.put("status", "permission_required");
            call.resolve(result);
            return;
        }

        executor.execute(() -> {
            try {
                // Re-verify canonical confinement, SHA-256, package, version, and signing cert right before launch
                File updatesDir = getUpdatesDir();
                assertConfinedInside(updatesDir, apkFile);
                byte[] fileDigest = computeFileSha256(apkFile);
                byte[] expectedBytes = hexToBytes(expectedSha);
                if (!MessageDigest.isEqual(fileDigest, expectedBytes)) {
                    safeDelete(apkFile);
                    clearPendingUpdate();
                    call.reject("Update verification failed. Please try again.");
                    return;
                }

                verifyArchiveSafety(apkFile, expectedCode);
                launchSystemInstaller(apkFile);

                JSObject result = new JSObject();
                result.put("status", "installing");
                call.resolve(result);
            } catch (SecurityException se) {
                safeDelete(apkFile);
                clearPendingUpdate();
                call.reject(se.getMessage() != null ? se.getMessage() : "Update verification failed.");
            } catch (Exception e) {
                call.reject("Unable to start the system installer. Please try again.");
            }
        });
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String rawUrl = call.getString("url");
        String rawFileName = call.getString("fileName");
        String expectedSha256 = call.getString("expectedSha256");
        long expectedVersionCode = call.getLong("expectedVersionCode", 0L);

        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            call.reject("Invalid update download address.");
            return;
        }
        if (expectedSha256 == null || !HEX_SHA256.matcher(expectedSha256.trim()).matches()) {
            call.reject("Update integrity metadata is incomplete.");
            return;
        }

        String sanitizedName = sanitizeFileName(rawFileName);
        if (sanitizedName == null) {
            call.reject("Invalid update package name.");
            return;
        }

        if (!isDownloading.compareAndSet(false, true)) {
            call.reject("An update download is already in progress.");
            return;
        }
        cancelRequested.set(false);

        final String normalizedExpectedSha = expectedSha256.trim().toLowerCase(Locale.US);

        executor.execute(() -> {
            File partFile = null;
            File finalFile = null;
            try {
                File updatesDir = getUpdatesDir();
                cleanStaleFiles(updatesDir);

                partFile = new File(updatesDir, sanitizedName + ".part");
                finalFile = new File(updatesDir, sanitizedName);
                assertConfinedInside(updatesDir, partFile);
                assertConfinedInside(updatesDir, finalFile);
                safeDelete(partFile);
                safeDelete(finalFile);

                // Stream APK over HTTPS with strict per-hop host allowlisting
                byte[] computedDigest = downloadWithRedirectValidation(rawUrl.trim(), partFile);

                if (cancelRequested.get()) {
                    safeDelete(partFile);
                    JSObject cancelled = new JSObject();
                    cancelled.put("status", "cancelled");
                    call.resolve(cancelled);
                    return;
                }

                // 1. Constant-time SHA-256 verification
                byte[] expectedBytes = hexToBytes(normalizedExpectedSha);
                if (!MessageDigest.isEqual(computedDigest, expectedBytes)) {
                    safeDelete(partFile);
                    call.reject("Update integrity check failed. Please try downloading again.");
                    return;
                }

                if (!partFile.renameTo(finalFile)) {
                    safeDelete(partFile);
                    call.reject("Unable to prepare update package on device.");
                    return;
                }

                // 2. Verify packageName, non-downgrade versionCode, and signing certificate match
                verifyArchiveSafety(finalFile, expectedVersionCode);

                // Save reference so install can resume automatically if user needs to grant Unknown Sources permission
                pendingVerifiedApk = finalFile;
                pendingVerifiedSha256 = normalizedExpectedSha;
                pendingExpectedVersionCode = expectedVersionCode;

                if (!hasInstallPermission()) {
                    JSObject permResult = new JSObject();
                    permResult.put("status", "permission_required");
                    call.resolve(permResult);
                    return;
                }

                launchSystemInstaller(finalFile);

                JSObject result = new JSObject();
                result.put("status", "installing");
                call.resolve(result);
            } catch (CancelledException ce) {
                safeDelete(partFile);
                safeDelete(finalFile);
                clearPendingUpdate();
                JSObject cancelled = new JSObject();
                cancelled.put("status", "cancelled");
                call.resolve(cancelled);
            } catch (SecurityException se) {
                safeDelete(partFile);
                safeDelete(finalFile);
                clearPendingUpdate();
                call.reject(se.getMessage() != null ? se.getMessage() : "Update verification failed.");
            } catch (Exception e) {
                safeDelete(partFile);
                safeDelete(finalFile);
                clearPendingUpdate();
                call.reject("Download failed. Please check your internet connection and try again.");
            } finally {
                isDownloading.set(false);
            }
        });
    }

    private boolean hasInstallPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return getContext().getPackageManager().canRequestPackageInstalls();
        }
        return true;
    }

    private File getUpdatesDir() throws IOException {
        File dir = new File(getContext().getCacheDir(), "updates");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("Unable to create cache/updates directory.");
        }
        return dir;
    }

    private void assertConfinedInside(File baseDir, File targetFile) throws IOException {
        String baseCanonical = baseDir.getCanonicalPath();
        String targetCanonical = targetFile.getCanonicalPath();
        if (!targetCanonical.startsWith(baseCanonical + File.separator)) {
            throw new SecurityException("Blocked invalid update path.");
        }
    }

    private String sanitizeFileName(String rawName) {
        if (rawName == null) return null;
        String base = new File(rawName.trim()).getName();
        if (!SAFE_APK_NAME.matcher(base).matches()) {
            return null;
        }
        if (base.contains("..") || base.contains("/") || base.contains("\\")) {
            return null;
        }
        return base;
    }

    private void cleanStaleFiles(File updatesDir) {
        File[] files = updatesDir.listFiles();
        if (files == null) return;
        for (File f : files) {
            safeDelete(f);
        }
    }

    private void clearPendingUpdate() {
        pendingVerifiedApk = null;
        pendingVerifiedSha256 = null;
        pendingExpectedVersionCode = 0L;
    }

    private void safeDelete(File f) {
        if (f != null && f.exists()) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
        }
    }

    private void validateDownloadUri(URI uri) {
        if (uri == null) {
            throw new SecurityException("Invalid update download address.");
        }
        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (scheme == null || !"https".equalsIgnoreCase(scheme)) {
            throw new SecurityException("Update downloads must use secure HTTPS.");
        }
        if (host == null) {
            throw new SecurityException("Update host is invalid.");
        }
        String normalizedHost = host.toLowerCase(Locale.US);
        if (!ALLOWED_DOWNLOAD_HOSTS.contains(normalizedHost)) {
            throw new SecurityException("Blocked update download from an untrusted source.");
        }
    }

    private byte[] downloadWithRedirectValidation(String initialUrl, File outputFile) throws Exception {
        URI currentUri = URI.create(initialUrl);
        validateDownloadUri(currentUri);

        HttpURLConnection connection = null;
        try {
            int redirectCount = 0;
            while (true) {
                if (cancelRequested.get()) {
                    throw new CancelledException();
                }

                URL url = currentUri.toURL();
                connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
                connection.setReadTimeout(READ_TIMEOUT_MS);
                connection.setRequestMethod("GET");
                connection.setRequestProperty("Accept", "application/octet-stream");
                connection.setRequestProperty("User-Agent", "GOM-Android-Updater");

                int status = connection.getResponseCode();
                if (status == HttpURLConnection.HTTP_MOVED_PERM
                        || status == HttpURLConnection.HTTP_MOVED_TEMP
                        || status == HttpURLConnection.HTTP_SEE_OTHER
                        || status == 307
                        || status == 308) {
                    if (redirectCount >= MAX_REDIRECTS) {
                        throw new IOException("Too many redirects while downloading update.");
                    }
                    String location = connection.getHeaderField("Location");
                    connection.disconnect();
                    connection = null;

                    if (location == null || location.trim().isEmpty()) {
                        throw new IOException("Redirect missing destination.");
                    }
                    URI nextUri = currentUri.resolve(location.trim());
                    validateDownloadUri(nextUri);
                    currentUri = nextUri;
                    redirectCount++;
                    continue;
                }

                if (status < 200 || status >= 300) {
                    throw new IOException("Server returned HTTP " + status);
                }

                long totalBytes = connection.getContentLengthLong();
                if (totalBytes > MAX_APK_BYTES) {
                    throw new SecurityException("Update package exceeds maximum allowed size.");
                }

                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long downloaded = 0L;
                long lastProgressEmitMs = 0L;

                try (InputStream rawIn = new BufferedInputStream(connection.getInputStream());
                     FileOutputStream out = new FileOutputStream(outputFile)) {
                    byte[] buffer = new byte[16 * 1024];
                    int bytesRead;
                    while ((bytesRead = rawIn.read(buffer)) != -1) {
                        if (cancelRequested.get()) {
                            throw new CancelledException();
                        }
                        downloaded += bytesRead;
                        if (downloaded > MAX_APK_BYTES) {
                            throw new SecurityException("Update package exceeds maximum allowed size.");
                        }
                        digest.update(buffer, 0, bytesRead);
                        out.write(buffer, 0, bytesRead);

                        long now = System.currentTimeMillis();
                        if (now - lastProgressEmitMs >= 120L || (totalBytes > 0 && downloaded >= totalBytes)) {
                            lastProgressEmitMs = now;
                            emitProgress(downloaded, totalBytes);
                        }
                    }
                    out.getFD().sync();
                }

                emitProgress(downloaded, totalBytes > 0 ? totalBytes : downloaded);
                return digest.digest();
            }
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private void emitProgress(long bytesDownloaded, long totalBytes) {
        int percent = 0;
        if (totalBytes > 0) {
            percent = (int) Math.min(100L, Math.round((bytesDownloaded * 100.0) / totalBytes));
        }
        JSObject payload = new JSObject();
        payload.put("bytesDownloaded", bytesDownloaded);
        payload.put("totalBytes", totalBytes);
        payload.put("percent", percent);
        notifyListeners("updateDownloadProgress", payload);
    }

    private void verifyArchiveSafety(File apkFile, long expectedVersionCode) throws Exception {
        Context context = getContext();
        PackageManager pm = context.getPackageManager();
        String installedPkgName = context.getPackageName();

        int sigFlags = getSigningFlags();
        PackageInfo installedInfo = getInstalledPackageInfo(pm, installedPkgName, sigFlags);
        PackageInfo archiveInfo = getArchivePackageInfo(pm, apkFile.getAbsolutePath(), sigFlags);

        if (archiveInfo == null) {
            throw new SecurityException("Downloaded update package could not be read.");
        }

        // Check 1: Package name must match installed app exactly
        if (!installedPkgName.equals(archiveInfo.packageName)) {
            throw new SecurityException("Update package does not match this application.");
        }

        // Check 2: Block version downgrades
        long installedCode = PackageInfoCompat.getLongVersionCode(installedInfo);
        long archiveCode = PackageInfoCompat.getLongVersionCode(archiveInfo);
        if (archiveCode < installedCode) {
            throw new SecurityException("Cannot install an older version over the current app.");
        }
        if (expectedVersionCode > 0 && archiveCode < expectedVersionCode) {
            throw new SecurityException("Downloaded package version does not match the published update.");
        }

        // Check 3: Signing certificate SHA-256 must match installed app's signing certificate
        List<byte[]> installedCerts = extractCertificateDigests(installedInfo);
        List<byte[]> archiveCerts = extractCertificateDigests(archiveInfo);

        if (installedCerts.isEmpty() || archiveCerts.isEmpty()) {
            throw new SecurityException("Unable to verify application signature.");
        }

        boolean signatureMatched = false;
        for (byte[] installedCert : installedCerts) {
            for (byte[] archiveCert : archiveCerts) {
                if (MessageDigest.isEqual(installedCert, archiveCert)) {
                    signatureMatched = true;
                    break;
                }
            }
            if (signatureMatched) break;
        }

        if (!signatureMatched) {
            throw new SecurityException("This update was signed with a different key than your installed version. Please install the latest version once to enable automatic updates.");
        }
    }

    private int getSigningFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return PackageManager.GET_SIGNING_CERTIFICATES;
        }
        //noinspection deprecation
        return PackageManager.GET_SIGNATURES;
    }

    private PackageInfo getInstalledPackageInfo(PackageManager pm, String pkgName, int flags) throws PackageManager.NameNotFoundException {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return pm.getPackageInfo(pkgName, PackageManager.PackageInfoFlags.of(flags));
        }
        //noinspection deprecation
        return pm.getPackageInfo(pkgName, flags);
    }

    private PackageInfo getArchivePackageInfo(PackageManager pm, String apkPath, int flags) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return pm.getPackageArchiveInfo(apkPath, PackageManager.PackageInfoFlags.of(flags));
        }
        //noinspection deprecation
        return pm.getPackageArchiveInfo(apkPath, flags);
    }

    private List<byte[]> extractCertificateDigests(PackageInfo info) throws NoSuchAlgorithmException {
        List<Signature> signatures = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && info.signingInfo != null) {
            SigningInfo signingInfo = info.signingInfo;
            Signature[] contentsSigners = signingInfo.getApkContentsSigners();
            if (contentsSigners != null) {
                Collections.addAll(signatures, contentsSigners);
            }
            if (!signingInfo.hasMultipleSigners()) {
                Signature[] history = signingInfo.getSigningCertificateHistory();
                if (history != null) {
                    Collections.addAll(signatures, history);
                }
            }
        }
        if (signatures.isEmpty()) {
            //noinspection deprecation
            Signature[] legacy = info.signatures;
            if (legacy != null) {
                Collections.addAll(signatures, legacy);
            }
        }

        List<byte[]> digests = new ArrayList<>();
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        for (Signature sig : signatures) {
            if (sig != null) {
                digests.add(sha256.digest(sig.toByteArray()));
            }
        }
        return digests;
    }

    private byte[] computeFileSha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new BufferedInputStream(new java.io.FileInputStream(file))) {
            byte[] buffer = new byte[16 * 1024];
            int read;
            while ((read = in.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
        }
        return digest.digest();
    }

    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            int high = Character.digit(hex.charAt(i), 16);
            int low = Character.digit(hex.charAt(i + 1), 16);
            if (high < 0 || low < 0) {
                throw new IllegalArgumentException("Invalid checksum format.");
            }
            data[i / 2] = (byte) ((high << 4) + low);
        }
        return data;
    }

    private void launchSystemInstaller(File apkFile) {
        Context context = getContext();
        Uri contentUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
        );

        Intent installIntent = new Intent(Intent.ACTION_VIEW);
        installIntent.setDataAndType(contentUri, "application/vnd.android.package-archive");
        installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(installIntent);
    }

    private static class CancelledException extends Exception {
    }
}
