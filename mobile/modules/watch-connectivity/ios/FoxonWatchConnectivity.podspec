Pod::Spec.new do |s|
  s.name           = 'FoxonWatchConnectivity'
  s.version        = '1.0.0'
  s.summary        = 'WCSession bridge between the Foxon app and its watchOS companion'
  s.description    = 'Pushes workout templates to the watch via applicationContext and receives queued session payloads via transferUserInfo.'
  s.author         = 'Foxon'
  s.homepage       = 'https://github.com/dmytrolutsik/foxon'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = '**/*.{h,m,swift}'
end
