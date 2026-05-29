module.exports = {
  expo: {
    name: "TrueCheck",
    slug: "truecheck",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0A0F1E"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.truecheck.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0F1E"
      },
      package: "com.truecheck.app",
      versionCode: 1
    },
    plugins: ["expo-image-picker"],
    extra: {
      eas: {
      projectId: "f1d5d80a-1eaa-4048-956f-0003f193e8f3" 
      }
    },
    owner: "thampi3145"
  }
};
