//
//  MqttClient.h
//  AwesomeMqtt
//
//  Created by Thanh Tùng on 07/04/2021.
//  Copyright © 2021 Facebook. All rights reserved.
//

#ifndef MqttClient_h
#define MqttClient_h

#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>
#import <MQTTClient/MQTTClient.h>
#import <MQTTClient/MQTTSessionManager.h>
#import <MQTTClient/MQTTSSLSecurityPolicy.h>

@interface MqttClient : NSObject <MQTTSessionManagerDelegate>

- (MqttClient*) initWithEmitter:(RCTEventEmitter *) emitter
                        options:(NSDictionary *) options
                      clientRef:(NSString *) clientRef;
- (void) connect;
- (void) disconnect;
- (BOOL) isConnected;
- (BOOL) isSubscribed:(NSString *) topic;
- (NSMutableArray *) getTopics;
- (void) subscribe:(NSString *)topic qos:(NSNumber *)qos;
- (void) unsubscribe:(NSString *)topic;
- (void) publish:(NSString *) topic data:(NSData *)data qos:(NSNumber *)qos retain:(BOOL) retain;
@end

#endif /* MqttClient_h */
