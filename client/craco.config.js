module.exports = {
  devServer: (devServerConfig) => {
    devServerConfig.allowedHosts = "all"; // ✅ Force allowedHosts to valid value
    return devServerConfig;
  },
};
