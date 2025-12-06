package com.yunichat.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallSignalRequest {
    private String type; // CALL_OFFER, CALL_ANSWER, ICE_CANDIDATE, CALL_END, CALL_REJECT, CALL_BUSY
    private Long callerId;
    private Long calleeId;
    private String sdp; // Session Description Protocol for OFFER/ANSWER
    private String candidate; // ICE candidate data
    private String callType; // AUDIO or VIDEO
}
