#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <React/RCTEventDispatcher.h>
// Project imports
#import "AwesomeMqtt.h"
#import "MqttClient.h"

@interface AwesomeMqtt ()
@property NSMutableDictionary *clients;
@end


@implementation AwesomeMqtt
{
    bool hasListeners;
}

RCT_EXPORT_MODULE();


+ (BOOL) requiresMainQueueSetup{
    return NO;
}

- (instancetype)init
{
    if ((self = [super init])) {
        _clients = [[NSMutableDictionary alloc] init];
    }
    return self;
    
}


- (void)sendEventWithName:(NSString *)name body:(id)body {
    if (hasListeners && self.bridge) { // Only send events if anyone is listening
        [super sendEventWithName:name body:body];
    }
}

- (NSArray<NSString *> *)supportedEvents {
    return @[ @"mqtt_events" ];
}

// Will be called when this module's first listener is added.
- (void)startObserving {
    hasListeners = YES;
    // Set up any upstream listeners or background tasks as necessary
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
    hasListeners = NO;
    // Remove upstream listeners, stop unnecessary background tasks
}

RCT_EXPORT_METHOD(createClient:(NSDictionary *) options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    NSString *clientRef = [[NSProcessInfo processInfo] globallyUniqueString];
    MqttClient *client = [[MqttClient allocWithZone: nil] initWithEmitter:self options:options clientRef:clientRef];
    
    [[self clients] setObject:client forKey:clientRef];
    resolve(clientRef);
    
}

RCT_EXPORT_METHOD(removeClient:(nonnull NSString *) clientRef) {
    [[self clients] removeObjectForKey:clientRef];
}


RCT_EXPORT_METHOD(connect:(nonnull NSString *) clientRef) {
    [[[self clients] objectForKey:clientRef] connect];
}

RCT_EXPORT_METHOD(disconnect:(nonnull NSString *) clientRef) {
    [[[self clients] objectForKey:clientRef] disconnect];
}

RCT_EXPORT_METHOD(isConnected:(nonnull NSString *) clientRef resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    //RCTLogInfo(@"Bridge handling call to core for isConnected");
    if([[self clients] objectForKey:clientRef]) {
        BOOL conn = [[[self clients] objectForKey:clientRef] isConnected];
        //RCTLogInfo(@"Client: %@ isConnected: %s", clientRef, conn ? "true" : "false");
        resolve(@(conn));
    } else {
        NSError *error = [[NSError alloc] initWithDomain:@"com.kuhmute.kca" code:404 userInfo:@{@"Error reason": @"Client Not Found"}];
        reject(@"client_not_found", @"This client doesn't exist", error);
    }
}

RCT_EXPORT_METHOD(isSubbed:(nonnull NSString *) clientRef:(nonnull NSString*)topic resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    //RCTLogInfo(@"Bridge handling call to core for topic: %@", topic);
    if([[self clients] objectForKey:clientRef]) {
        BOOL subbed = [[[self clients] objectForKey:clientRef] isSubscribed:clientRef];
        //RCTLogInfo(@"Client: %@ isSubbed: %s", clientRef, subbed ? "true" : "false");
        resolve(@(subbed));
    } else {
        
        NSError *error = [[NSError alloc] initWithDomain:@"com.kuhmute.kca" code:404 userInfo:@{@"Error reason": @"Client Not Found"}];
        reject(@"client_not_found", @"This client doesn't exist", error);
    }
}

RCT_EXPORT_METHOD(getTopics:(nonnull NSString *) clientRef resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    //RCTLogInfo(@"Bridge handling call to core for client: %@", clientRef);
    if([[self clients] objectForKey:clientRef]) {
        NSMutableArray *ret = [[[self clients] objectForKey:clientRef] getTopics];
        //RCTLogInfo(@"Client: %@ topics: %@", clientRef, ret);
        resolve(ret);
    } else {
        NSError *error = [[NSError alloc] initWithDomain:@"com.kuhmute.kca" code:404 userInfo:@{@"Error reason": @"Client Not Found"}];
        reject(@"client_not_found", @"This client doesn't exist", error);
    }
}

RCT_EXPORT_METHOD(disconnectAll) {
    if (self.clients.count > 0) {
        for(NSString* aClientRef in self.clients) {
            [[[self clients] objectForKey:aClientRef] disconnect];
        }
    }
}

RCT_EXPORT_METHOD(subscribe:(nonnull NSString *) clientRef topic:(NSString *)topic qos:(nonnull NSNumber *)qos) {
    [[[self clients] objectForKey:clientRef] subscribe:topic qos:qos];
}

RCT_EXPORT_METHOD(unsubscribe:(nonnull NSString *) clientRef topic:(NSString *)topic) {
    [[[self clients] objectForKey:clientRef] unsubscribe:topic];
}

RCT_EXPORT_METHOD(publish:(nonnull NSString *) clientRef topic:(NSString *)topic data:(NSString*)data qos:(nonnull NSNumber *)qos retain:(BOOL)retain) {
    [[[self clients] objectForKey:clientRef] publish:topic
                                                data:[data dataUsingEncoding:NSUTF8StringEncoding]
                                                 qos:qos
                                              retain:retain];
}

- (void)invalidate
{
    [self disconnectAll];
}

@end
