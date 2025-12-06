package com.yunichat.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallSignalResponse {
    private String type;
    private Long callerId;
    private String callerUsername;
    private Long calleeId;
    private String calleeUsername;
    private String sdp;
    private String candidate;
    private String callType;
    private Long timestamp;
}
