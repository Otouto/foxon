/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'watch',
  name: 'FoxonWatch',
  displayName: 'Foxon',
  // watchOS 10 minimum: the session UI relies on .verticalPage TabView paging
  deploymentTarget: '10.0',
  bundleIdentifier: '.watch',
  icon: '../../assets/images/icon.png',
  frameworks: ['SwiftUI', 'WatchConnectivity'],
};
