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
     "projectId": "49814a72-cbf7-447e-92c9-098c3fc8ee38"
      }
    },
    owner: "shyam3145"
  }
};
