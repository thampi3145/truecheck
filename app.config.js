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
    "projectId": "e9c8ef20-96a6-4713-8bd1-87e51a160e45"
      }
    },
    owner: "nio3145"
  }
};
