/**
 * Deterministic Compliance Rules Engine
 * 
 * This file defines the static, deterministic rules that form the core
 * of the compliance checking system. Each rule is evaluated consistently
 * to ensure identical inputs always yield identical outputs.
 */

export type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS';
export type Severity = 'high' | 'medium' | 'low';

export interface ComplianceRule {
  ruleId: string;
  platform: Platform;
  severity: Severity;
  category: string;
  description: string;
  checkLogic: (files: { [key: string]: string | null }) => boolean;
  staticSolution: string;
  requiredFiles?: string[];
}

/**
 * Deterministic rule checking functions
 * These functions return true if a violation is found
 */

const hasPrivacyPolicy = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyMd = files['PRIVACY.md'] || files['privacy-policy.md'];
  
  // Check if privacy policy URL exists in README or if privacy file exists
  const hasPrivacyUrl = readme.includes('privacy') && (
    readme.includes('http://') || 
    readme.includes('https://')
  );
  
  // If privacy file exists, check if it has substantial content (not just placeholder)
  if (privacyMd) {
    const privacyContent = privacyMd.toLowerCase();
    const placeholderKeywords = ['lorem ipsum', 'placeholder', 'your app name', 'todo', 'coming soon', 'template'];
    const hasPlaceholderContent = placeholderKeywords.some(keyword => privacyContent.includes(keyword));
    const hasSubstantialContent = privacyContent.length > 200; // At least 200 characters
    
    if (hasPlaceholderContent || !hasSubstantialContent) {
      return true; // Violation: privacy file exists but has placeholder/insufficient content
    }
  }
  
  return !hasPrivacyUrl && !privacyMd;
};

const hasDataCollectionDisclosure = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyMd = (files['PRIVACY.md'] || files['privacy-policy.md'] || '').toLowerCase();
  
  const dataKeywords = ['data collection', 'collect data', 'user data', 'personal information'];
  const hasDisclosure = dataKeywords.some(keyword => 
    readme.includes(keyword) || privacyMd.includes(keyword)
  );
  
  return !hasDisclosure;
};

const hasAppDescription = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md'] || '';
  const appJson = files['app.json'];
  const packageJson = files['package.json'];
  
  // Check if README has substantial content and not placeholder text
  const readmeContent = readme.toLowerCase();
  const placeholderKeywords = ['lorem ipsum', 'your app name', 'todo', 'coming soon', 'template', 'placeholder'];
  const hasPlaceholderContent = placeholderKeywords.some(keyword => readmeContent.includes(keyword));
  const hasReadmeContent = readme.length > 100 && !hasPlaceholderContent;
  
  // Check if app.json or package.json has meaningful description
  let hasJsonDescription = false;
  try {
    if (appJson) {
      const parsed = JSON.parse(appJson);
      const desc = parsed.description?.toLowerCase() || '';
      const hasPlaceholder = placeholderKeywords.some(keyword => desc.includes(keyword));
      hasJsonDescription = !!parsed.description && parsed.description.length > 20 && !hasPlaceholder;
    }
    if (!hasJsonDescription && packageJson) {
      const parsed = JSON.parse(packageJson);
      const desc = parsed.description?.toLowerCase() || '';
      const hasPlaceholder = placeholderKeywords.some(keyword => desc.includes(keyword));
      hasJsonDescription = !!parsed.description && parsed.description.length > 20 && !hasPlaceholder;
    }
  } catch (e) {
    // Invalid JSON
  }
  
  return !hasReadmeContent && !hasJsonDescription;
};

const hasPermissionsDocumentation = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const androidManifest = files['AndroidManifest.xml'] || '';
  const infoPlist = files['Info.plist'] || '';
  
  const hasPermissions = androidManifest.includes('permission') || infoPlist.includes('Usage');
  const hasDocumentation = readme.includes('permission') || readme.includes('access');
  
  return hasPermissions && !hasDocumentation;
};

const hasThirdPartyDisclosure = (files: { [key: string]: string | null }): boolean => {
  const packageJson = files['package.json'];
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyMd = (files['PRIVACY.md'] || files['privacy-policy.md'] || '').toLowerCase();
  
  let hasThirdPartyDeps = false;
  try {
    if (packageJson) {
      const parsed = JSON.parse(packageJson);
      const deps = Object.keys(parsed.dependencies || {});
      // Check for common analytics/tracking SDKs
      const trackingLibs = ['firebase', 'analytics', 'mixpanel', 'amplitude', 'segment'];
      hasThirdPartyDeps = deps.some(dep => 
        trackingLibs.some(lib => dep.toLowerCase().includes(lib))
      );
    }
  } catch (e) {
    // Invalid JSON
  }
  
  const hasDisclosure = readme.includes('third-party') || 
                        readme.includes('third party') ||
                        privacyMd.includes('third-party') ||
                        privacyMd.includes('third party');
  
  return hasThirdPartyDeps && !hasDisclosure;
};

const hasContentRating = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const appJson = files['app.json'];
  
  let hasRating = false;
  try {
    if (appJson) {
      const parsed = JSON.parse(appJson);
      hasRating = !!parsed.contentRating || !!parsed.rating;
    }
  } catch (e) {
    // Invalid JSON
  }
  
  const hasRatingInReadme = readme.includes('rating') || 
                            readme.includes('age') ||
                            readme.includes('mature');
  
  return !hasRating && !hasRatingInReadme;
};

const hasDataSafetySection = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyMd = (files['PRIVACY.md'] || files['privacy-policy.md'] || '').toLowerCase();
  
  const dataSafetyKeywords = ['data safety', 'data security', 'data protection', 'secure data'];
  const hasSafetyInfo = dataSafetyKeywords.some(keyword => 
    readme.includes(keyword) || privacyMd.includes(keyword)
  );
  
  return !hasSafetyInfo;
};

const hasDeveloperContact = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const packageJson = files['package.json'];
  
  const contactKeywords = ['contact', 'support', 'email', '@', 'help'];
  const hasContactInReadme = contactKeywords.some(keyword => readme.includes(keyword));
  
  let hasContactInPackage = false;
  try {
    if (packageJson) {
      const parsed = JSON.parse(packageJson);
      hasContactInPackage = !!(parsed.author || parsed.maintainers || parsed.bugs?.url || parsed.homepage);
    }
  } catch (e) {
    // Invalid JSON
  }
  
  return !hasContactInReadme && !hasContactInPackage;
};

const hasAppName = (files: { [key: string]: string | null }): boolean => {
  const appJson = files['app.json'];
  const packageJson = files['package.json'];
  
  let hasName = false;
  try {
    if (appJson) {
      const parsed = JSON.parse(appJson);
      hasName = !!parsed.name && parsed.name.length > 0 && parsed.name.length <= 30;
    }
    if (!hasName && packageJson) {
      const parsed = JSON.parse(packageJson);
      hasName = !!parsed.name && parsed.name.length > 0;
    }
  } catch (e) {
    // Invalid JSON
  }
  
  return !hasName;
};

const hasPrivacyManifest = (files: { [key: string]: string | null }): boolean => {
  const privacyManifest = files['PrivacyInfo.xcprivacy'];
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if privacy manifest exists or is documented
  const hasManifestFile = !!privacyManifest;
  const hasManifestDocumentation = readme.includes('privacy manifest') || 
                                   readme.includes('privacyinfo.xcprivacy');
  
  return !hasManifestFile && !hasManifestDocumentation;
};

const hasUserGeneratedContentPolicy = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const termsOfService = files['TERMS.md']?.toLowerCase() || '';
  const communityGuidelines = files['COMMUNITY_GUIDELINES.md']?.toLowerCase() || '';
  
  const moderationKeywords = ['content moderation', 'report content', 'block user', 'filter content', 'user reporting'];
  const hasModeration = moderationKeywords.some(keyword => 
    readme.includes(keyword) || termsOfService.includes(keyword) || communityGuidelines.includes(keyword)
  );
  
  // Check if app has user-generated content features
  const ugcKeywords = ['user content', 'user posts', 'comments', 'reviews', 'social', 'chat', 'messaging'];
  const hasUGC = ugcKeywords.some(keyword => readme.includes(keyword));
  
  return hasUGC && !hasModeration;
};

const hasAppTransportSecurity = (files: { [key: string]: string | null }): boolean => {
  const infoPlist = files['Info.plist'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if ATS is properly configured or documented
  const hasATSConfig = infoPlist.includes('NSAppTransportSecurity') || 
                       infoPlist.includes('NSAllowsArbitraryLoads');
  const hasSecurityDocumentation = readme.includes('app transport security') || 
                                   readme.includes('https') || 
                                   readme.includes('tls');
  
  return !hasATSConfig && !hasSecurityDocumentation;
};

const hasSubscriptionTerms = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const termsOfService = files['TERMS.md']?.toLowerCase() || '';
  const packageJson = files['package.json'];
  
  // Check if app has subscription features
  let hasSubscriptions = false;
  try {
    if (packageJson) {
      const parsed = JSON.parse(packageJson);
      const deps = Object.keys(parsed.dependencies || {});
      hasSubscriptions = deps.some(dep => 
        dep.toLowerCase().includes('subscription') || 
        dep.toLowerCase().includes('billing') ||
        dep.toLowerCase().includes('payment')
      );
    }
  } catch (e) {
    // Invalid JSON
  }
  
  const subscriptionKeywords = ['subscription', 'auto-renew', 'billing', 'premium'];
  hasSubscriptions = hasSubscriptions || subscriptionKeywords.some(keyword => readme.includes(keyword));
  
  const termsKeywords = ['subscription terms', 'auto-renewal', 'cancellation', 'refund policy'];
  const hasTerms = termsKeywords.some(keyword => 
    readme.includes(keyword) || termsOfService.includes(keyword)
  );
  
  return hasSubscriptions && !hasTerms;
};

const hasRestorePurchases = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const packageJson = files['package.json'];
  
  // Check if app has in-app purchases
  let hasIAP = false;
  try {
    if (packageJson) {
      const parsed = JSON.parse(packageJson);
      const deps = Object.keys(parsed.dependencies || {});
      hasIAP = deps.some(dep => 
        dep.toLowerCase().includes('purchase') || 
        dep.toLowerCase().includes('billing') ||
        dep.toLowerCase().includes('payment')
      );
    }
  } catch (e) {
    // Invalid JSON
  }
  
  const iapKeywords = ['in-app purchase', 'premium features', 'unlock', 'subscription'];
  hasIAP = hasIAP || iapKeywords.some(keyword => readme.includes(keyword));
  
  const restoreKeywords = ['restore purchase', 'restore subscription', 'restore premium'];
  const hasRestore = restoreKeywords.some(keyword => readme.includes(keyword));
  
  return hasIAP && !hasRestore;
};

const hasAgeRating = (files: { [key: string]: string | null }): boolean => {
  const appJson = files['app.json'];
  const readme = files['README.md']?.toLowerCase() || '';
  
  let hasRating = false;
  try {
    if (appJson) {
      const parsed = JSON.parse(appJson);
      hasRating = !!parsed.contentRating || !!parsed.ageRating;
    }
  } catch (e) {
    // Invalid JSON
  }
  
  const ratingKeywords = ['age rating', '4+', '9+', '12+', '17+', 'mature content'];
  const hasRatingInReadme = ratingKeywords.some(keyword => readme.includes(keyword));
  
  return !hasRating && !hasRatingInReadme;
};

const hasBackgroundModeJustification = (files: { [key: string]: string | null }): boolean => {
  const infoPlist = files['Info.plist'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  const hasBackgroundModes = infoPlist.includes('UIBackgroundModes');
  const backgroundKeywords = ['background', 'voip', 'location', 'audio playback', 'push notification'];
  const hasJustification = backgroundKeywords.some(keyword => readme.includes(keyword));
  
  return hasBackgroundModes && !hasJustification;
};

const hasLocationUsageDescription = (files: { [key: string]: string | null }): boolean => {
  const infoPlist = files['Info.plist'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  const hasLocationPermission = infoPlist.includes('NSLocationWhenInUseUsageDescription') || 
                                infoPlist.includes('NSLocationAlwaysAndWhenInUseUsageDescription');
  const locationKeywords = ['location', 'gps', 'maps', 'navigation', 'geolocation'];
  const hasLocationDocumentation = locationKeywords.some(keyword => readme.includes(keyword));
  
  return hasLocationPermission && !hasLocationDocumentation;
};

const hasCameraUsageDescription = (files: { [key: string]: string | null }): boolean => {
  const infoPlist = files['Info.plist'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  const hasCameraPermission = infoPlist.includes('NSCameraUsageDescription');
  const cameraKeywords = ['camera', 'photo', 'video', 'capture', 'ar', 'augmented reality'];
  const hasCameraDocumentation = cameraKeywords.some(keyword => readme.includes(keyword));
  
  return hasCameraPermission && !hasCameraDocumentation;
};

const hasMinimumFunctionality = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md'] || '';
  const packageJson = files['package.json'];
  
  // Check if app provides substantial functionality beyond a website
  const functionalityKeywords = ['features', 'functionality', 'interactive', 'native', 'offline'];
  const hasFunctionality = functionalityKeywords.some(keyword => 
    readme.toLowerCase().includes(keyword)
  );
  
  // Check if it's just a web wrapper
  const webWrapperKeywords = ['webview', 'web app', 'website wrapper', 'browser'];
  const isWebWrapper = webWrapperKeywords.some(keyword => 
    readme.toLowerCase().includes(keyword)
  );
  
  return !hasFunctionality || isWebWrapper;
};

const hasAppCompleteness = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check for placeholder content or incomplete features
  const placeholderKeywords = ['coming soon', 'placeholder', 'todo', 'under construction', 'beta', 'demo only'];
  const hasPlaceholders = placeholderKeywords.some(keyword => readme.includes(keyword));
  
  const incompleteKeywords = ['not implemented', 'work in progress', 'wip', 'incomplete'];
  const hasIncompleteFeatures = incompleteKeywords.some(keyword => readme.includes(keyword));
  
  return hasPlaceholders || hasIncompleteFeatures;
};

// Additional Apple App Store specific rule checking functions

const hasAppTrackingTransparency = (files: { [key: string]: string | null }): boolean => {
  const infoPlist = files['Info.plist'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if app uses tracking identifiers
  const hasTrackingUsage = infoPlist.includes('NSUserTrackingUsageDescription') || 
                           readme.includes('idfa') || 
                           readme.includes('tracking') ||
                           readme.includes('advertising identifier');
  
  // Check if ATT framework is mentioned
  const hasATTImplementation = readme.includes('app tracking transparency') || 
                               readme.includes('att framework') ||
                               readme.includes('requesttrackingauthorization');
  
  return hasTrackingUsage && !hasATTImplementation;
};

const hasSignInWithApple = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const packageJson = files['package.json'];
  
  // Check if app has third-party social login
  const socialLoginKeywords = ['google sign in', 'facebook login', 'twitter login', 'social login', 'oauth'];
  const hasSocialLogin = socialLoginKeywords.some(keyword => readme.includes(keyword));
  
  let hasThirdPartyAuth = false;
  try {
    if (packageJson) {
      const parsed = JSON.parse(packageJson);
      const deps = Object.keys(parsed.dependencies || {});
      hasThirdPartyAuth = deps.some(dep => 
        dep.toLowerCase().includes('google') || 
        dep.toLowerCase().includes('facebook') ||
        dep.toLowerCase().includes('auth')
      );
    }
  } catch (e) {
    // Invalid JSON
  }
  
  const hasAppleSignIn = readme.includes('sign in with apple') || 
                         readme.includes('apple authentication') ||
                         readme.includes('authenticationservices');
  
  return (hasSocialLogin || hasThirdPartyAuth) && !hasAppleSignIn;
};

const hasAccountDeletionFeature = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if app supports account creation
  const hasAccountFeatures = readme.includes('account') || 
                             readme.includes('sign up') || 
                             readme.includes('registration') ||
                             readme.includes('user profile');
  
  // Check if account deletion is mentioned
  const deletionKeywords = ['delete account', 'account deletion', 'remove account', 'deactivate account'];
  const hasAccountDeletion = deletionKeywords.some(keyword => readme.includes(keyword));
  
  return hasAccountFeatures && !hasAccountDeletion;
};

const hasUsageDescriptions = (files: { [key: string]: string | null }): boolean => {
  const infoPlist = files['Info.plist'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check for sensitive permissions without proper descriptions
  const sensitivePermissions = [
    'NSCameraUsageDescription',
    'NSPhotoLibraryUsageDescription', 
    'NSMicrophoneUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'NSLocationAlwaysAndWhenInUseUsageDescription',
    'NSContactsUsageDescription',
    'NSCalendarsUsageDescription'
  ];
  
  const hasSensitivePermissions = sensitivePermissions.some(permission => 
    infoPlist.includes(permission)
  );
  
  const hasUsageDocumentation = readme.includes('usage description') || 
                                readme.includes('permission') ||
                                readme.includes('access');
  
  return hasSensitivePermissions && !hasUsageDocumentation;
};

const hasNonPublicApiUsage = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check for mentions of private APIs or undocumented features
  const privateApiKeywords = ['private api', 'undocumented', 'internal api', 'non-public'];
  const hasPrivateApiMention = privateApiKeywords.some(keyword => readme.includes(keyword));
  
  // Check for proper API usage documentation
  const publicApiKeywords = ['public api', 'official sdk', 'documented api'];
  const hasPublicApiMention = publicApiKeywords.some(keyword => readme.includes(keyword));
  
  return hasPrivateApiMention && !hasPublicApiMention;
};

const hasExecutableCodeDownload = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check for dynamic code loading or execution
  const codeDownloadKeywords = ['download code', 'dynamic loading', 'runtime code', 'executable download'];
  const hasCodeDownload = codeDownloadKeywords.some(keyword => readme.includes(keyword));
  
  // Check for legitimate use cases
  const legitimateKeywords = ['webview', 'javascript', 'web content'];
  const hasLegitimateUse = legitimateKeywords.some(keyword => readme.includes(keyword));
  
  return hasCodeDownload && !hasLegitimateUse;
};

const hasMisleadingSubscriptionUX = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if app has subscriptions
  const hasSubscriptions = readme.includes('subscription') || 
                           readme.includes('premium') ||
                           readme.includes('auto-renew');
  
  // Check for transparency in subscription terms
  const transparencyKeywords = ['clear pricing', 'subscription terms', 'cancellation', 'trial period'];
  const hasTransparency = transparencyKeywords.some(keyword => readme.includes(keyword));
  
  // Check for potentially misleading practices
  const misleadingKeywords = ['hidden fee', 'automatic charge', 'difficult to cancel'];
  const hasMisleadingPractices = misleadingKeywords.some(keyword => readme.includes(keyword));
  
  return hasSubscriptions && (!hasTransparency || hasMisleadingPractices);
};

// Google Play Store specific rule checking functions

const hasTargetSdkCompliance = (files: { [key: string]: string | null }): boolean => {
  const buildGradle = files['build.gradle'] || files['app/build.gradle'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if target SDK is documented or configured properly
  const hasTargetSdk = buildGradle.includes('targetSdkVersion') || buildGradle.includes('targetSdk');
  const hasTargetSdkDoc = readme.includes('target sdk') || readme.includes('api level');
  
  // Look for outdated target SDK mentions
  const outdatedSdkKeywords = ['api 30', 'api 31', 'api 32', 'api 33', 'targetsdkversion 30', 'targetsdkversion 31'];
  const hasOutdatedSdk = outdatedSdkKeywords.some(keyword => 
    buildGradle.toLowerCase().includes(keyword) || readme.includes(keyword)
  );
  
  return !hasTargetSdk && !hasTargetSdkDoc || hasOutdatedSdk;
};

const hasSecureNetworkConfig = (files: { [key: string]: string | null }): boolean => {
  const networkConfig = files['network_security_config.xml'] || files['res/xml/network_security_config.xml'];
  const androidManifest = files['AndroidManifest.xml'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if network security is configured
  const hasNetworkConfig = !!networkConfig || androidManifest.includes('networkSecurityConfig');
  const hasSecurityDoc = readme.includes('network security') || 
                          readme.includes('https') || 
                          readme.includes('tls') ||
                          readme.includes('ssl');
  
  // Check for insecure HTTP usage
  const hasInsecureHttp = readme.includes('http://') && !readme.includes('https://');
  
  return (!hasNetworkConfig && !hasSecurityDoc) || hasInsecureHttp;
};

const hasForegroundServiceCompliance = (files: { [key: string]: string | null }): boolean => {
  const androidManifest = files['AndroidManifest.xml'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  const hasForegroundService = androidManifest.includes('android:foregroundServiceType') || 
                               androidManifest.includes('FOREGROUND_SERVICE');
  
  const serviceKeywords = ['foreground service', 'background service', 'service type'];
  const hasServiceDocumentation = serviceKeywords.some(keyword => readme.includes(keyword));
  
  return hasForegroundService && !hasServiceDocumentation;
};

const hasPlayBillingCompliance = (files: { [key: string]: string | null }): boolean => {
  const buildGradle = files['build.gradle'] || files['app/build.gradle'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if app has billing features
  const hasBilling = buildGradle.includes('play-services-billing') || 
                     buildGradle.includes('billing') ||
                     readme.includes('purchase') ||
                     readme.includes('subscription') ||
                     readme.includes('premium');
  
  // Check for external payment mentions
  const externalPaymentKeywords = ['paypal', 'stripe', 'external payment', 'bypass billing'];
  const hasExternalPayment = externalPaymentKeywords.some(keyword => readme.includes(keyword));
  
  const playBillingKeywords = ['play billing', 'google play billing', 'billing library'];
  const hasPlayBilling = playBillingKeywords.some(keyword => readme.includes(keyword));
  
  return hasBilling && (hasExternalPayment || !hasPlayBilling);
};

const hasDataDeletionMechanism = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyPolicy = (files['PRIVACY.md'] || files['privacy-policy.md'] || '').toLowerCase();
  
  const deletionKeywords = ['delete account', 'data deletion', 'remove data', 'account deletion'];
  const hasDeletionMechanism = deletionKeywords.some(keyword => 
    readme.includes(keyword) || privacyPolicy.includes(keyword)
  );
  
  // Check if app collects user data
  const dataCollectionKeywords = ['user data', 'personal information', 'account', 'profile'];
  const collectsData = dataCollectionKeywords.some(keyword => readme.includes(keyword));
  
  return collectsData && !hasDeletionMechanism;
};

const hasApiKeyProtection = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const stringsXml = files['strings.xml'] || files['res/values/strings.xml'] || '';
  const buildGradle = files['build.gradle'] || files['app/build.gradle'] || '';
  
  // Check for API key usage
  const hasApiKeys = stringsXml.includes('api_key') || 
                     stringsXml.includes('API_KEY') ||
                     buildGradle.includes('api_key') ||
                     readme.includes('api key');
  
  // Check for security documentation
  const securityKeywords = ['api key security', 'secure keys', 'encrypted keys', 'key protection'];
  const hasKeySecurity = securityKeywords.some(keyword => readme.includes(keyword));
  
  // Check for hardcoded keys (security risk)
  const hasHardcodedKeys = stringsXml.includes('AIza') || // Google API key pattern
                           stringsXml.includes('sk_') ||  // Stripe key pattern
                           buildGradle.includes('AIza');
  
  return hasApiKeys && (!hasKeySecurity || hasHardcodedKeys);
};

const hasDangerousPermissionJustification = (files: { [key: string]: string | null }): boolean => {
  const androidManifest = files['AndroidManifest.xml'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check for dangerous permissions
  const dangerousPermissions = [
    'READ_CONTACTS', 'WRITE_CONTACTS', 'READ_SMS', 'SEND_SMS', 'READ_CALL_LOG',
    'CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
    'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'
  ];
  
  const hasDangerousPermissions = dangerousPermissions.some(permission => 
    androidManifest.includes(permission)
  );
  
  const permissionKeywords = ['permission', 'access', 'runtime permission', 'user consent'];
  const hasPermissionJustification = permissionKeywords.some(keyword => readme.includes(keyword));
  
  return hasDangerousPermissions && !hasPermissionJustification;
};

// Chrome Web Store specific rule checking functions

const hasManifestV3Compliance = (files: { [key: string]: string | null }): boolean => {
  const manifestJson = files['manifest.json'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if it's a Chrome extension
  const isExtension = manifestJson.includes('"manifest_version"') || 
                      readme.includes('chrome extension') ||
                      readme.includes('browser extension');
  
  if (!isExtension) return false;
  
  // Parse and validate manifest content
  try {
    if (manifestJson) {
      const manifest = JSON.parse(manifestJson);
      
      // Check for Manifest V3 compliance
      const hasManifestV3 = manifest.manifest_version === 3;
      
      // Check for placeholder content in manifest
      const placeholderKeywords = ['your extension name', 'todo', 'placeholder', 'template'];
      const hasPlaceholderContent = placeholderKeywords.some(keyword => 
        JSON.stringify(manifest).toLowerCase().includes(keyword)
      );
      
      // Check for required V3 fields
      const hasRequiredFields = manifest.name && manifest.version && manifest.description;
      
      return !hasManifestV3 || hasPlaceholderContent || !hasRequiredFields;
    }
  } catch (e) {
    // Invalid JSON - this is a violation
    return true;
  }
  
  const hasV3Documentation = readme.includes('manifest v3') || 
                             readme.includes('manifest version 3');
  
  return isExtension && !hasV3Documentation;
};

const hasSinglePurpose = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const manifestJson = files['manifest.json'] || '';
  
  // Check if it's a Chrome extension
  const isExtension = manifestJson.includes('"manifest_version"') || 
                      readme.includes('chrome extension');
  
  if (!isExtension) return false;
  
  // Check for single purpose documentation
  const purposeKeywords = ['single purpose', 'main function', 'primary feature', 'core functionality'];
  const hasPurposeDoc = purposeKeywords.some(keyword => readme.includes(keyword));
  
  // Check for multiple unrelated features
  const multipleFeatures = ['and also', 'additionally', 'plus', 'bundled with'];
  const hasMultipleFeatures = multipleFeatures.some(keyword => readme.includes(keyword));
  
  return isExtension && (!hasPurposeDoc || hasMultipleFeatures);
};

const hasExtensionPrivacyPolicy = (files: { [key: string]: string | null }): boolean => {
  const manifestJson = files['manifest.json'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  const privacyMd = files['PRIVACY.md'] || files['privacy-policy.md'];
  
  // Check if it's a Chrome extension that handles user data
  const isExtension = manifestJson.includes('"manifest_version"') || 
                      readme.includes('chrome extension');
  
  if (!isExtension) return false;
  
  // Check if extension handles user data
  const handlesUserData = manifestJson.includes('"permissions"') || 
                          readme.includes('user data') ||
                          readme.includes('personal information');
  
  // Check for privacy policy
  const hasPrivacyPolicy = !!privacyMd || 
                           readme.includes('privacy policy') ||
                           readme.includes('privacy.html');
  
  return isExtension && handlesUserData && !hasPrivacyPolicy;
};

const hasExcessivePermissions = (files: { [key: string]: string | null }): boolean => {
  const manifestJson = files['manifest.json'] || '';
  const readme = files['README.md']?.toLowerCase() || '';
  
  // Check if it's a Chrome extension
  const isExtension = manifestJson.includes('"manifest_version"');
  
  if (!isExtension) return false;
  
  // Check for broad permissions
  const broadPermissions = ['<all_urls>', 'http://*/*', 'https://*/*', 'activeTab', 'tabs'];
  const hasBroadPermissions = broadPermissions.some(permission => 
    manifestJson.includes(permission)
  );
  
  // Check for permission justification
  const permissionKeywords = ['permission', 'access', 'necessary', 'required for'];
  const hasPermissionJustification = permissionKeywords.some(keyword => readme.includes(keyword));
  
  return isExtension && hasBroadPermissions && !hasPermissionJustification;
};

const hasCodeObfuscation = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const manifestJson = files['manifest.json'] || '';
  
  // Check if it's a Chrome extension
  const isExtension = manifestJson.includes('"manifest_version"');
  
  if (!isExtension) return false;
  
  // Check for code obfuscation mentions
  const obfuscationKeywords = ['obfuscated', 'minified', 'compressed', 'encoded'];
  const hasObfuscation = obfuscationKeywords.some(keyword => readme.includes(keyword));
  
  // Check for code readability documentation
  const readabilityKeywords = ['readable code', 'source code', 'unminified', 'clear logic'];
  const hasReadabilityDoc = readabilityKeywords.some(keyword => readme.includes(keyword));
  
  return isExtension && hasObfuscation && !hasReadabilityDoc;
};

const hasDeceptiveContent = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const manifestJson = files['manifest.json'] || '';
  
  // Check if it's a Chrome extension
  const isExtension = manifestJson.includes('"manifest_version"');
  
  if (!isExtension) return false;
  
  // Check for potentially deceptive content
  const deceptiveKeywords = ['fake', 'impersonate', 'misleading', 'trick users', 'disguise'];
  const hasDeceptiveContent = deceptiveKeywords.some(keyword => readme.includes(keyword));
  
  // Check for transparency documentation
  const transparencyKeywords = ['honest', 'transparent', 'clear description', 'accurate'];
  const hasTransparency = transparencyKeywords.some(keyword => readme.includes(keyword));
  
  return isExtension && (hasDeceptiveContent || !hasTransparency);
};

const hasSecureDataHandling = (files: { [key: string]: string | null }): boolean => {
  const readme = files['README.md']?.toLowerCase() || '';
  const manifestJson = files['manifest.json'] || '';
  
  // Check if it's a Chrome extension
  const isExtension = manifestJson.includes('"manifest_version"');
  
  if (!isExtension) return false;
  
  // Check if extension handles sensitive data
  const handlesData = readme.includes('user data') || 
                      readme.includes('personal information') ||
                      manifestJson.includes('"permissions"');
  
  // Check for security documentation
  const securityKeywords = ['https', 'encryption', 'secure', 'tls', 'ssl'];
  const hasSecurityDoc = securityKeywords.some(keyword => readme.includes(keyword));
  
  // Check for insecure practices
  const insecureKeywords = ['http://', 'unencrypted', 'plain text'];
  const hasInsecurePractices = insecureKeywords.some(keyword => readme.includes(keyword));
  
  return isExtension && handlesData && (!hasSecurityDoc || hasInsecurePractices);
};

/**
 * Complete list of deterministic compliance rules
 * These rules are evaluated in order and form the source of truth
 */
export const COMPLIANCE_RULES: ComplianceRule[] = [
  // Apple App Store Rules
  {
    ruleId: 'AAS-001',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Privacy Policy',
    description: 'No publicly accessible privacy policy URL is mentioned or provided in the repository files. A privacy policy is a mandatory requirement for all apps submitted to the Apple App Store (App Store Review Guideline 5.1.1).',
    checkLogic: hasPrivacyPolicy,
    staticSolution: 'Create a comprehensive privacy policy document, host it online at a stable URL, and include this URL prominently in the app\'s metadata on App Store Connect and within the app itself. The policy should detail data collection, usage, and sharing practices.',
    requiredFiles: ['README.md', 'PRIVACY.md', 'privacy-policy.md'],
  },
  {
    ruleId: 'AAS-002',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Data Collection Disclosure',
    description: 'No explicit disclosure regarding what specific user data is collected, how it\'s used, stored, or whether any of it is transmitted off-device or shared with third parties. This detailed disclosure is required for App Store Connect\'s privacy manifest (App Store Review Guideline 5.1.1, 5.1.2).',
    checkLogic: hasDataCollectionDisclosure,
    staticSolution: 'Implement a comprehensive privacy policy that clearly outlines all data collection practices, including what data is collected, why it\'s collected, how it\'s used, whether it\'s stored locally or transmitted, and if it\'s shared with any third parties.',
    requiredFiles: ['README.md', 'PRIVACY.md'],
  },
  {
    ruleId: 'AAS-003',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'App Description',
    description: 'The app lacks a clear, comprehensive description of its functionality. App Store guidelines require accurate and detailed descriptions of app features.',
    checkLogic: hasAppDescription,
    staticSolution: 'Add a detailed description in your README.md and app.json/package.json that clearly explains what your app does, its main features, and how users interact with it.',
    requiredFiles: ['README.md', 'app.json', 'package.json'],
  },
  {
    ruleId: 'AAS-004',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Third-party SDK Disclosure',
    description: 'The app appears to use third-party SDKs or libraries but does not disclose their data collection practices. Apple requires disclosure of all third-party data collection.',
    checkLogic: hasThirdPartyDisclosure,
    staticSolution: 'Document all third-party SDKs and libraries used in your app, and disclose their data collection practices in your privacy policy.',
    requiredFiles: ['package.json', 'README.md', 'PRIVACY.md'],
  },
  {
    ruleId: 'AAS-005',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Developer Information',
    description: 'Apps must include accurate and up-to-date contact information so users can reach you with questions and support issues (App Store Review Guideline 1.5).',
    checkLogic: hasDeveloperContact,
    staticSolution: 'Add contact information to your README.md and package.json, including email, support URL, or other ways for users to reach you for support.',
    requiredFiles: ['README.md', 'package.json'],
  },
  {
    ruleId: 'AAS-006',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'App Name',
    description: 'App name is missing or exceeds the 30-character limit. App names must be unique and limited to 30 characters (App Store Review Guideline 2.3.7).',
    checkLogic: hasAppName,
    staticSolution: 'Choose a unique app name that is 30 characters or less and add it to your app.json or package.json file.',
    requiredFiles: ['app.json', 'package.json'],
  },
  {
    ruleId: 'AAS-007',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Privacy Manifest',
    description: 'Missing privacy manifest file (PrivacyInfo.xcprivacy). Starting May 1, 2024, all iOS apps must include a privacy manifest that outlines data collection and API usage.',
    checkLogic: hasPrivacyManifest,
    staticSolution: 'Create a PrivacyInfo.xcprivacy file using Xcode 15 or later (File > New > File > App Privacy File) and declare all APIs, data types, and tracking domains used by your app.',
    requiredFiles: ['PrivacyInfo.xcprivacy', 'README.md'],
  },
  {
    ruleId: 'AAS-008',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'User-Generated Content',
    description: 'Apps with user-generated content must include content moderation features: filtering objectionable material, reporting mechanisms, and user blocking capabilities (App Store Review Guideline 1.2).',
    checkLogic: hasUserGeneratedContentPolicy,
    staticSolution: 'Implement and document content moderation features including: a method for filtering objectionable content, a mechanism to report offensive content, and the ability to block abusive users.',
    requiredFiles: ['README.md', 'TERMS.md', 'COMMUNITY_GUIDELINES.md'],
  },
  {
    ruleId: 'AAS-009',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'App Transport Security',
    description: 'Missing App Transport Security (ATS) configuration. Apple requires secure network connections using TLS 1.2 or higher (App Store Review Guideline 1.6).',
    checkLogic: hasAppTransportSecurity,
    staticSolution: 'Configure App Transport Security in your Info.plist file and document your security practices. Use HTTPS for all network connections and implement SSL pinning where appropriate.',
    requiredFiles: ['Info.plist', 'README.md'],
  },
  {
    ruleId: 'AAS-010',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Subscription Terms',
    description: 'Apps offering subscriptions must clearly describe subscription terms, pricing, and auto-renewal details before purchase (App Store Review Guideline 3.1.2).',
    checkLogic: hasSubscriptionTerms,
    staticSolution: 'Document subscription terms including pricing, duration, auto-renewal details, and cancellation policy. Make this information easily accessible to users before they subscribe.',
    requiredFiles: ['README.md', 'TERMS.md'],
  },
  {
    ruleId: 'AAS-011',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Restore Purchases',
    description: 'Apps with non-consumable in-app purchases or subscriptions must provide a "Restore Purchases" mechanism (App Store Review Guideline 3.1.1).',
    checkLogic: hasRestorePurchases,
    staticSolution: 'Implement and document a "Restore Purchases" feature that allows users to restore their previous purchases when reinstalling the app or switching devices.',
    requiredFiles: ['README.md', 'package.json'],
  },
  {
    ruleId: 'AAS-012',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Age Rating',
    description: 'Apps must have an appropriate age rating that accurately reflects the content. Answer age rating questions honestly in App Store Connect (App Store Review Guideline 2.3.6).',
    checkLogic: hasAgeRating,
    staticSolution: 'Set an appropriate age rating (4+, 9+, 12+, or 17+) in your app.json and document any mature content or features that affect the rating.',
    requiredFiles: ['app.json', 'README.md'],
  },
  {
    ruleId: 'AAS-013',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Background Modes',
    description: 'Apps using background modes must justify their usage and use them only for their intended purposes (App Store Review Guideline 2.5.4).',
    checkLogic: hasBackgroundModeJustification,
    staticSolution: 'Document why your app needs background modes and ensure they are used only for their intended purposes (VoIP, audio playback, location, task completion, etc.).',
    requiredFiles: ['Info.plist', 'README.md'],
  },
  {
    ruleId: 'AAS-014',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Location Usage',
    description: 'Apps requesting location access must clearly explain why location data is needed and how it will be used (App Store Review Guideline 5.1.1).',
    checkLogic: hasLocationUsageDescription,
    staticSolution: 'Document why your app needs location access, how the data will be used, and ensure your NSLocationUsageDescription strings are clear and specific.',
    requiredFiles: ['Info.plist', 'README.md'],
  },
  {
    ruleId: 'AAS-015',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Camera Usage',
    description: 'Apps requesting camera access must clearly explain why camera access is needed and how it will be used (App Store Review Guideline 5.1.1).',
    checkLogic: hasCameraUsageDescription,
    staticSolution: 'Document why your app needs camera access, how it will be used, and ensure your NSCameraUsageDescription string is clear and specific.',
    requiredFiles: ['Info.plist', 'README.md'],
  },
  {
    ruleId: 'AAS-016',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Minimum Functionality',
    description: 'Apps should provide substantial functionality beyond a repackaged website. Apps that are not useful, unique, or "app-like" don\'t belong on the App Store (App Store Review Guideline 4.2).',
    checkLogic: hasMinimumFunctionality,
    staticSolution: 'Enhance your app with native features, offline functionality, and interactive elements that provide value beyond a simple web experience.',
    requiredFiles: ['README.md', 'package.json'],
  },
  {
    ruleId: 'AAS-017',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'App Completeness',
    description: 'Submissions should be final versions with all necessary functionality complete. Placeholder text, empty websites, and temporary content should be removed (App Store Review Guideline 2.1).',
    checkLogic: hasAppCompleteness,
    staticSolution: 'Remove all placeholder content, "coming soon" features, and incomplete functionality. Submit only fully functional, polished versions of your app.',
    requiredFiles: ['README.md'],
  },
  {
    ruleId: 'AAS-018',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'App Tracking Transparency',
    description: 'Apps that track users across other companies\' apps and websites must use the App Tracking Transparency framework to request permission (App Store Review Guideline 5.1.2).',
    checkLogic: hasAppTrackingTransparency,
    staticSolution: 'Implement the App Tracking Transparency framework and call requestTrackingAuthorization before collecting data for tracking. Add NSUserTrackingUsageDescription to Info.plist.',
    requiredFiles: ['Info.plist', 'README.md'],
  },
  {
    ruleId: 'AAS-019',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Sign in with Apple',
    description: 'Apps that offer third-party social login must also offer Sign in with Apple as an equivalent option (App Store Review Guideline 4.8).',
    checkLogic: hasSignInWithApple,
    staticSolution: 'Implement Sign in with Apple using the AuthenticationServices framework and display it with equal prominence to other social login options.',
    requiredFiles: ['README.md', 'package.json'],
  },
  {
    ruleId: 'AAS-020',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Account Deletion',
    description: 'Apps that support account creation must provide an easy, in-app way for users to initiate account and data deletion (App Store Review Guideline 5.1.1).',
    checkLogic: hasAccountDeletionFeature,
    staticSolution: 'Add a clearly visible account deletion feature in your app\'s settings or profile section that allows users to delete their account and data.',
    requiredFiles: ['README.md'],
  },
  {
    ruleId: 'AAS-021',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Usage Descriptions',
    description: 'Apps accessing sensitive user data must provide clear, complete usage descriptions in Info.plist explaining why the data is needed (App Store Review Guideline 5.1.1).',
    checkLogic: hasUsageDescriptions,
    staticSolution: 'Add comprehensive usage descriptions for all sensitive permissions in Info.plist (NSCameraUsageDescription, NSLocationUsageDescription, etc.) with clear explanations.',
    requiredFiles: ['Info.plist', 'README.md'],
  },
  {
    ruleId: 'AAS-022',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Non-Public APIs',
    description: 'Apps must only use public APIs and documented frameworks. Use of private or undocumented APIs will result in rejection (App Store Review Guideline 2.5.1).',
    checkLogic: hasNonPublicApiUsage,
    staticSolution: 'Replace all private API usage with public alternatives from official Apple SDKs. Use only documented APIs and frameworks.',
    requiredFiles: ['README.md'],
  },
  {
    ruleId: 'AAS-023',
    platform: 'APPLE_APP_STORE',
    severity: 'high',
    category: 'Executable Code Download',
    description: 'Apps may not download or execute code that introduces or changes features or functionality after installation (App Store Review Guideline 2.5.2).',
    checkLogic: hasExecutableCodeDownload,
    staticSolution: 'Remove any code that downloads and executes external scripts or binaries. Use only standard WebView for web content display.',
    requiredFiles: ['README.md'],
  },
  {
    ruleId: 'AAS-024',
    platform: 'APPLE_APP_STORE',
    severity: 'medium',
    category: 'Subscription UX',
    description: 'Subscription interfaces must be clear and transparent, with prominently displayed pricing, terms, and cancellation information (App Store Review Guideline 3.1.2).',
    checkLogic: hasMisleadingSubscriptionUX,
    staticSolution: 'Design clear subscription interfaces with transparent pricing, trial periods, and easy-to-find cancellation options. Avoid misleading or deceptive practices.',
    requiredFiles: ['README.md'],
  },
  
  // Google Play Store Rules
  {
    ruleId: 'GPS-001',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'high',
    category: 'Privacy Policy',
    description: 'No privacy policy link is provided. Google Play Store requires all apps that collect user data to have a publicly accessible privacy policy.',
    checkLogic: hasPrivacyPolicy,
    staticSolution: 'Create and host a privacy policy online, then add the URL to your app\'s Play Store listing and within the app itself.',
    requiredFiles: ['README.md', 'PRIVACY.md'],
  },
  {
    ruleId: 'GPS-002',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'high',
    category: 'Data Safety Section',
    description: 'Missing or incomplete Data Safety section information. Google Play requires detailed disclosure of data collection and sharing practices.',
    checkLogic: hasDataSafetySection,
    staticSolution: 'Complete the Data Safety section in Google Play Console, declaring all data collection, usage, and sharing practices. Document these practices in your repository.',
    requiredFiles: ['README.md', 'PRIVACY.md'],
  },
  {
    ruleId: 'GPS-003',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'medium',
    category: 'Permissions Documentation',
    description: 'The app requests permissions but does not clearly document why each permission is needed. Google Play guidelines require justification for all permissions.',
    checkLogic: hasPermissionsDocumentation,
    staticSolution: 'Document each permission your app requests in the README.md, explaining why it\'s necessary and how it\'s used.',
    requiredFiles: ['README.md', 'AndroidManifest.xml'],
  },
  {
    ruleId: 'GPS-004',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'medium',
    category: 'Content Rating',
    description: 'No content rating information is provided. Google Play requires all apps to have an appropriate content rating.',
    checkLogic: hasContentRating,
    staticSolution: 'Complete the content rating questionnaire in Google Play Console and document the rating in your app metadata.',
    requiredFiles: ['README.md', 'app.json'],
  },
  {
    ruleId: 'GPS-005',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'high',
    category: 'Target SDK Compliance',
    description: 'App target SDK version is too low or outdated. Google requires apps to target recent API levels to ensure security and privacy features are enabled.',
    checkLogic: hasTargetSdkCompliance,
    staticSolution: 'Update your targetSdkVersion in build.gradle to meet Google\'s current requirements (API 34+ as of 2024). Document your target SDK version in README.md.',
    requiredFiles: ['build.gradle', 'app/build.gradle', 'README.md'],
  },
  {
    ruleId: 'GPS-006',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'high',
    category: 'Network Security',
    description: 'Missing network security configuration or insecure HTTP usage. Google requires secure network connections and proper TLS configuration.',
    checkLogic: hasSecureNetworkConfig,
    staticSolution: 'Implement Network Security Configuration, use HTTPS for all network requests, and document your security practices. Avoid plain HTTP connections.',
    requiredFiles: ['network_security_config.xml', 'AndroidManifest.xml', 'README.md'],
  },
  {
    ruleId: 'GPS-007',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'medium',
    category: 'Foreground Service',
    description: 'Apps using foreground services must properly declare service types and justify their usage. Improper foreground service use violates Google Play policies.',
    checkLogic: hasForegroundServiceCompliance,
    staticSolution: 'Properly declare android:foregroundServiceType in your manifest and document why your app needs foreground services. Ensure service types match actual functionality.',
    requiredFiles: ['AndroidManifest.xml', 'README.md'],
  },
  {
    ruleId: 'GPS-008',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'high',
    category: 'Play Billing Compliance',
    description: 'Apps with digital purchases must use Google Play Billing. External payment systems for digital goods violate Google Play policies.',
    checkLogic: hasPlayBillingCompliance,
    staticSolution: 'Use Google Play Billing Library for all digital purchases and subscriptions. Remove any external payment systems for digital content. Document your billing implementation.',
    requiredFiles: ['build.gradle', 'README.md'],
  },
  {
    ruleId: 'GPS-009',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'medium',
    category: 'Data Deletion',
    description: 'Apps collecting user data must provide a way for users to delete their accounts and data. Google requires clear data deletion mechanisms.',
    checkLogic: hasDataDeletionMechanism,
    staticSolution: 'Implement and document a clear account deletion feature within your app. Provide users with an easy way to delete their data and accounts.',
    requiredFiles: ['README.md', 'PRIVACY.md'],
  },
  {
    ruleId: 'GPS-010',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'high',
    category: 'API Key Security',
    description: 'API keys must be properly secured and not hardcoded in the app. Exposed API keys create security vulnerabilities and policy violations.',
    checkLogic: hasApiKeyProtection,
    staticSolution: 'Store API keys securely using encrypted storage or build-time injection. Remove hardcoded keys from strings.xml and source code. Document your key security practices.',
    requiredFiles: ['strings.xml', 'build.gradle', 'README.md'],
  },
  {
    ruleId: 'GPS-011',
    platform: 'GOOGLE_PLAY_STORE',
    severity: 'high',
    category: 'Dangerous Permissions',
    description: 'Apps requesting dangerous permissions must provide clear justification and obtain proper user consent. Undisclosed sensitive data collection violates privacy policies.',
    checkLogic: hasDangerousPermissionJustification,
    staticSolution: 'Document why your app needs each dangerous permission and implement runtime permission requests with clear explanations. Ensure user consent before accessing sensitive data.',
    requiredFiles: ['AndroidManifest.xml', 'README.md'],
  },

  // Chrome Web Store Rules
  {
    ruleId: 'CWS-001',
    platform: 'CHROME_WEB_STORE',
    severity: 'high',
    category: 'Manifest V3 Compliance',
    description: 'New Chrome extensions must use Manifest V3. Manifest V2 extensions are deprecated and will not be accepted for new submissions.',
    checkLogic: hasManifestV3Compliance,
    staticSolution: 'Update your extension to use Manifest V3. Migrate from Manifest V2 APIs to their V3 equivalents and update your manifest.json file.',
    requiredFiles: ['manifest.json', 'README.md'],
  },
  {
    ruleId: 'CWS-002',
    platform: 'CHROME_WEB_STORE',
    severity: 'high',
    category: 'Single Purpose',
    description: 'Extensions must have a single, narrow, and easy-to-understand purpose. Bundling unrelated functionality is prohibited.',
    checkLogic: hasSinglePurpose,
    staticSolution: 'Focus your extension on a single, clear purpose. Remove unrelated features and document the primary function clearly in your README.',
    requiredFiles: ['README.md', 'manifest.json'],
  },
  {
    ruleId: 'CWS-003',
    platform: 'CHROME_WEB_STORE',
    severity: 'high',
    category: 'Privacy Policy',
    description: 'Extensions that handle user data must have an accurate and up-to-date privacy policy that discloses data collection, use, and sharing practices.',
    checkLogic: hasExtensionPrivacyPolicy,
    staticSolution: 'Create a comprehensive privacy policy that details all data collection practices. Host it online and link to it in your extension and store listing.',
    requiredFiles: ['manifest.json', 'README.md', 'PRIVACY.md'],
  },
  {
    ruleId: 'CWS-004',
    platform: 'CHROME_WEB_STORE',
    severity: 'medium',
    category: 'Excessive Permissions',
    description: 'Extensions should only request permissions necessary for their stated purpose. Excessive or unjustified permissions violate Chrome Web Store policies.',
    checkLogic: hasExcessivePermissions,
    staticSolution: 'Review and minimize permissions in manifest.json. Document why each permission is necessary for your extension\'s core functionality.',
    requiredFiles: ['manifest.json', 'README.md'],
  },
  {
    ruleId: 'CWS-005',
    platform: 'CHROME_WEB_STORE',
    severity: 'medium',
    category: 'Code Readability',
    description: 'Extension code must not be obfuscated or conceal functionality. While minification is allowed, the logic must be discernible.',
    checkLogic: hasCodeObfuscation,
    staticSolution: 'Ensure your code is readable and logic is discernible. If using minification, provide clear documentation about your extension\'s functionality.',
    requiredFiles: ['README.md', 'manifest.json'],
  },
  {
    ruleId: 'CWS-006',
    platform: 'CHROME_WEB_STORE',
    severity: 'high',
    category: 'Honest and Transparent',
    description: 'Extensions and their store listings must not be misleading or deceptive. All functionality must be clearly stated and honest.',
    checkLogic: hasDeceptiveContent,
    staticSolution: 'Ensure all descriptions, screenshots, and functionality are accurate and honest. Remove any misleading claims or deceptive practices.',
    requiredFiles: ['README.md', 'manifest.json'],
  },
  {
    ruleId: 'CWS-007',
    platform: 'CHROME_WEB_STORE',
    severity: 'high',
    category: 'Secure Data Handling',
    description: 'User data must be handled securely with modern cryptography (HTTPS). Extensions must not transmit data insecurely.',
    checkLogic: hasSecureDataHandling,
    staticSolution: 'Use HTTPS for all data transmission. Implement proper encryption for sensitive data and document your security practices.',
    requiredFiles: ['README.md', 'manifest.json'],
  },
];

/**
 * Get rules applicable to a specific platform
 */
export function getRulesForPlatform(platform: Platform): ComplianceRule[] {
  if (platform === 'MOBILE_PLATFORMS') {
    return COMPLIANCE_RULES.filter(rule => 
      rule.platform === 'APPLE_APP_STORE' || 
      rule.platform === 'GOOGLE_PLAY_STORE' || 
      rule.platform === 'MOBILE_PLATFORMS'
    );
  }
  
  return COMPLIANCE_RULES.filter(rule => 
    rule.platform === platform || 
    (rule.platform === 'MOBILE_PLATFORMS' && 
     (platform === 'APPLE_APP_STORE' || platform === 'GOOGLE_PLAY_STORE'))
  );
}

/**
 * Evaluate all rules against repository files
 * Returns list of violated rules (deterministic)
 */
export function evaluateRules(
  files: { [key: string]: string | null },
  platform: Platform
): ComplianceRule[] {
  const applicableRules = getRulesForPlatform(platform);
  const violations: ComplianceRule[] = [];
  
  for (const rule of applicableRules) {
    try {
      const isViolated = rule.checkLogic(files);
      if (isViolated) {
        violations.push(rule);
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.ruleId}:`, error);
      // Continue with other rules
    }
  }
  
  return violations;
}
