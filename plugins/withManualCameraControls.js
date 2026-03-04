/**
 * Expo Config Plugin — Manual Camera Controls for VisionCamera
 *
 * Patches react-native-vision-camera's native Android code at prebuild/build time
 * to add Camera2 CaptureRequest-level manual controls:
 *   - ISO (SENSOR_SENSITIVITY)
 *   - Shutter Speed (SENSOR_EXPOSURE_TIME)
 *   - White Balance (CONTROL_AWB_MODE + COLOR_CORRECTION_GAINS)
 *   - Manual Focus (CONTROL_AF_MODE + LENS_FOCUS_DISTANCE)
 *
 * These are applied via CameraX's Camera2Interop / Camera2CameraControl.
 */

const {
  withDangerousMod,
  createRunOncePlugin,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// ────────────────────────────────────────────────────────────────
// 1. Patch CameraConfiguration.kt — add new fields
// ────────────────────────────────────────────────────────────────
function patchCameraConfiguration(projectRoot) {
  const filePath = path.join(
    projectRoot,
    "node_modules/react-native-vision-camera/android/src/main/java/com/mrousavy/camera/core/CameraConfiguration.kt"
  );
  let content = fs.readFileSync(filePath, "utf8");

  // Skip if already patched
  if (content.includes("manualISO")) return;

  // Add manual control fields after "exposure: Double? = null,"
  content = content.replace(
    "var exposure: Double? = null,",
    `var exposure: Double? = null,

  // Manual Camera Controls (CuspisCam)
  var manualISO: Int? = null,
  var manualShutterSpeed: Long? = null,   // nanoseconds (e.g. 8_000_000 = 1/125s)
  var manualWhiteBalance: Int? = null,     // Kelvin temperature (e.g. 5000)
  var manualFocusMode: String? = null,     // "manual" or "auto"`
  );

  // Add manual controls to sidePropsChanged diff
  content = content.replace(
    "left.exposure != right.exposure",
    `left.exposure != right.exposure ||
        left.manualISO != right.manualISO ||
        left.manualShutterSpeed != right.manualShutterSpeed ||
        left.manualWhiteBalance != right.manualWhiteBalance ||
        left.manualFocusMode != right.manualFocusMode`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log("[ManualCameraControls] ✅ Patched CameraConfiguration.kt");
}

// ────────────────────────────────────────────────────────────────
// 2. Patch CameraSession+Configuration.kt — apply Camera2 controls
// ────────────────────────────────────────────────────────────────
function patchCameraSessionConfiguration(projectRoot) {
  const filePath = path.join(
    projectRoot,
    "node_modules/react-native-vision-camera/android/src/main/java/com/mrousavy/camera/core/CameraSession+Configuration.kt"
  );
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("applyManualCameraControls")) return;

  // Add imports
  const importBlock = `import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.params.RggbChannelVector
import androidx.camera.camera2.interop.Camera2CameraControl
import androidx.camera.camera2.interop.CaptureRequestOptions
import androidx.camera.camera2.interop.ExperimentalCamera2Interop`;

  content = content.replace(
    "import kotlin.math.roundToInt",
    `import kotlin.math.roundToInt\n${importBlock}`
  );

  // Add the manual controls function after configureSideProps
  const manualControlsFunction = `

@OptIn(ExperimentalCamera2Interop::class)
internal fun CameraSession.applyManualCameraControls(config: CameraConfiguration) {
  val camera = camera ?: return
  val camera2Control = Camera2CameraControl.from(camera.cameraControl)

  val hasManualISO = config.manualISO != null && config.manualISO!! > 0
  val hasManualShutter = config.manualShutterSpeed != null && config.manualShutterSpeed!! > 0
  val hasManualWB = config.manualWhiteBalance != null && config.manualWhiteBalance!! > 0
  val isManualFocus = config.manualFocusMode == "manual"

  val optionsBuilder = CaptureRequestOptions.Builder()

  // ── Manual ISO + Shutter Speed ──
  // When either ISO or shutter speed is set manually, we disable auto-exposure
  if (hasManualISO || hasManualShutter) {
    optionsBuilder.setCaptureRequestOption(
      CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_OFF
    )

    if (hasManualISO) {
      optionsBuilder.setCaptureRequestOption(
        CaptureRequest.SENSOR_SENSITIVITY, config.manualISO!!
      )
    }

    if (hasManualShutter) {
      optionsBuilder.setCaptureRequestOption(
        CaptureRequest.SENSOR_EXPOSURE_TIME, config.manualShutterSpeed!!
      )
    }
  }

  // ── Manual White Balance ──
  if (hasManualWB) {
    optionsBuilder.setCaptureRequestOption(
      CaptureRequest.CONTROL_AWB_MODE, CaptureRequest.CONTROL_AWB_MODE_OFF
    )
    // Convert temperature (K) to approximate RGB gains
    val gains = kelvinToRggbGains(config.manualWhiteBalance!!)
    optionsBuilder.setCaptureRequestOption(
      CaptureRequest.COLOR_CORRECTION_MODE, CaptureRequest.COLOR_CORRECTION_MODE_TRANSFORM_MATRIX
    )
    optionsBuilder.setCaptureRequestOption(
      CaptureRequest.COLOR_CORRECTION_GAINS, gains
    )
  }

  // ── Manual Focus ──
  if (isManualFocus) {
    optionsBuilder.setCaptureRequestOption(
      CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_OFF
    )
    // Lock focus at current position — user taps to focus, then it stays locked
  }

  camera2Control.setCaptureRequestOptions(optionsBuilder.build())
  Log.i(CameraSession.TAG, "Applied manual camera controls: ISO=\${config.manualISO}, Shutter=\${config.manualShutterSpeed}ns, WB=\${config.manualWhiteBalance}K, Focus=\${config.manualFocusMode}")
}

/**
 * Convert color temperature in Kelvin to Camera2 RggbChannelVector gains.
 * Based on Tanner Helland's algorithm for converting color temp to RGB.
 */
private fun kelvinToRggbGains(tempK: Int): RggbChannelVector {
  val temp = tempK.toDouble() / 100.0
  val red: Double
  val green: Double
  val blue: Double

  // Red
  if (temp <= 66) {
    red = 255.0
  } else {
    red = (329.698727446 * Math.pow(temp - 60.0, -0.1332047592)).coerceIn(0.0, 255.0)
  }

  // Green
  if (temp <= 66) {
    green = (99.4708025861 * Math.log(temp) - 161.1195681661).coerceIn(0.0, 255.0)
  } else {
    green = (288.1221695283 * Math.pow(temp - 60.0, -0.0755148492)).coerceIn(0.0, 255.0)
  }

  // Blue
  if (temp >= 66) {
    blue = 255.0
  } else if (temp <= 19) {
    blue = 0.0
  } else {
    blue = (138.5177312231 * Math.log(temp - 10.0) - 305.0447927307).coerceIn(0.0, 255.0)
  }

  // Normalize to gains relative to green channel (green is reference = 1.0)
  val greenNorm = green / 255.0
  val redGain = (red / 255.0) / greenNorm
  val blueGain = (blue / 255.0) / greenNorm

  // Camera2 expects RggbChannelVector: [R, Gr, Gb, B]
  // We normalize so green channels = 1.0
  return RggbChannelVector(
    redGain.toFloat().coerceIn(1.0f, 10.0f),
    1.0f,
    1.0f,
    blueGain.toFloat().coerceIn(1.0f, 10.0f)
  )
}`;

  // Insert after configureSideProps function closing brace
  content = content.replace(
    "internal fun CameraSession.configureIsActive(config: CameraConfiguration) {",
    `${manualControlsFunction}\n\ninternal fun CameraSession.configureIsActive(config: CameraConfiguration) {`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log("[ManualCameraControls] ✅ Patched CameraSession+Configuration.kt");
}

// ────────────────────────────────────────────────────────────────
// 3. Patch CameraView.kt — add properties + pass to config
// ────────────────────────────────────────────────────────────────
function patchCameraView(projectRoot) {
  const filePath = path.join(
    projectRoot,
    "node_modules/react-native-vision-camera/android/src/main/java/com/mrousavy/camera/react/CameraView.kt"
  );
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("var manualISO")) return;

  // Add properties after "var exposure: Double = 0.0"
  content = content.replace(
    "var exposure: Double = 0.0",
    `var exposure: Double = 0.0
  var manualISO: Int = -1
  var manualShutterSpeed: Long = -1L
  var manualWhiteBalance: Int = -1
  var manualFocusMode: String = "auto"`
  );

  // Pass values to config — after "config.exposure = exposure"
  content = content.replace(
    "config.exposure = exposure",
    `config.exposure = exposure
        config.manualISO = if (manualISO > 0) manualISO else null
        config.manualShutterSpeed = if (manualShutterSpeed > 0) manualShutterSpeed else null
        config.manualWhiteBalance = if (manualWhiteBalance > 0) manualWhiteBalance else null
        config.manualFocusMode = manualFocusMode`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log("[ManualCameraControls] ✅ Patched CameraView.kt");
}

// ────────────────────────────────────────────────────────────────
// 4. Patch CameraViewManager.kt — add ReactProp annotations
// ────────────────────────────────────────────────────────────────
function patchCameraViewManager(projectRoot) {
  const filePath = path.join(
    projectRoot,
    "node_modules/react-native-vision-camera/android/src/main/java/com/mrousavy/camera/react/CameraViewManager.kt"
  );
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("setManualISO")) return;

  // Add new @ReactProp methods before the closing brace of the class
  const newProps = `
  @ReactProp(name = "manualISO", defaultInt = -1)
  fun setManualISO(view: CameraView, manualISO: Int) {
    view.manualISO = manualISO
  }

  @ReactProp(name = "manualShutterSpeed", defaultDouble = -1.0)
  fun setManualShutterSpeed(view: CameraView, manualShutterSpeed: Double) {
    view.manualShutterSpeed = manualShutterSpeed.toLong()
  }

  @ReactProp(name = "manualWhiteBalance", defaultInt = -1)
  fun setManualWhiteBalance(view: CameraView, manualWhiteBalance: Int) {
    view.manualWhiteBalance = manualWhiteBalance
  }

  @ReactProp(name = "manualFocusMode")
  fun setManualFocusMode(view: CameraView, manualFocusMode: String?) {
    view.manualFocusMode = manualFocusMode ?: "auto"
  }
`;

  // Insert before the final closing brace
  const lastBrace = content.lastIndexOf("}");
  content = content.substring(0, lastBrace) + newProps + "\n}";

  fs.writeFileSync(filePath, content, "utf8");
  console.log("[ManualCameraControls] ✅ Patched CameraViewManager.kt");
}

// ────────────────────────────────────────────────────────────────
// 5. Patch CameraSession.kt — call applyManualCameraControls
// ────────────────────────────────────────────────────────────────
function patchCameraSession(projectRoot) {
  const filePath = path.join(
    projectRoot,
    "node_modules/react-native-vision-camera/android/src/main/java/com/mrousavy/camera/core/CameraSession.kt"
  );
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("applyManualCameraControls")) return;

  // After "configureSideProps(config)" call, add manual controls
  content = content.replace(
    "configureSideProps(config)",
    `configureSideProps(config)\n          applyManualCameraControls(config)`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log("[ManualCameraControls] ✅ Patched CameraSession.kt");
}

// ────────────────────────────────────────────────────────────────
// Main plugin
// ────────────────────────────────────────────────────────────────
function withManualCameraControls(config) {
  return withDangerousMod(config, [
    "android",
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      console.log("[ManualCameraControls] Patching VisionCamera native code...");

      try {
        patchCameraConfiguration(projectRoot);
        patchCameraSessionConfiguration(projectRoot);
        patchCameraView(projectRoot);
        patchCameraViewManager(projectRoot);
        patchCameraSession(projectRoot);
        console.log("[ManualCameraControls] ✅ All patches applied successfully!");
      } catch (e) {
        console.error("[ManualCameraControls] ❌ Patch failed:", e);
      }

      return cfg;
    },
  ]);
}

module.exports = createRunOncePlugin(
  withManualCameraControls,
  "withManualCameraControls",
  "1.0.0"
);
