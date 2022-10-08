#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface AwesomeMqtt : RCTEventEmitter <RCTBridgeModule>

- (void) startObserving;

- (void) stopObserving;

- (void) invalidate;

- (void) sendEventWithName:(NSString *)name body:(id)body;

@end
