package com.yunichat.chat.service;

import com.yunichat.chat.dto.CreateRoomRequest;
import com.yunichat.chat.dto.RoomResponse;
import com.yunichat.chat.entity.ChatRoom;
import com.yunichat.chat.entity.RoomMember;
import com.yunichat.chat.repository.ChatRoomRepository;
import com.yunichat.chat.repository.RoomMemberRepository;
import com.yunichat.common.exception.BadRequestException;
import com.yunichat.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final RoomMemberRepository roomMemberRepository;

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, Long creatorId) {
        String roomId = UUID.randomUUID().toString();
        
        ChatRoom room = ChatRoom.builder()
                .roomId(roomId)
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .createdBy(creatorId)
                .isActive(true)
                .build();
        
        room = chatRoomRepository.save(room);
        
        // Add creator as owner
        RoomMember owner = RoomMember.builder()
                .roomId(roomId)
                .userId(creatorId)
                .role(RoomMember.MemberRole.OWNER)
                .build();
        roomMemberRepository.save(owner);
        
        // Add other members if provided
        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            for (Long memberId : request.getMemberIds()) {
                if (!memberId.equals(creatorId)) {
                    RoomMember member = RoomMember.builder()
                            .roomId(roomId)
                            .userId(memberId)
                            .role(RoomMember.MemberRole.MEMBER)
                            .build();
                    roomMemberRepository.save(member);
                }
            }
        }
        
        log.info("Created chat room: {} by user: {}", roomId, creatorId);
        return mapToRoomResponse(room);
    }

    public RoomResponse getRoomById(String roomId) {
        ChatRoom room = chatRoomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));
        return mapToRoomResponse(room);
    }

    public List<RoomResponse> getPublicRooms() {
        return chatRoomRepository.findAllPublicRooms().stream()
                .map(this::mapToRoomResponse)
                .collect(Collectors.toList());
    }

    public List<RoomResponse> getUserRooms(Long userId) {
        List<RoomMember> memberships = roomMemberRepository.findByUserId(userId);
        return memberships.stream()
                .map(membership -> chatRoomRepository.findByRoomId(membership.getRoomId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> mapToRoomResponse(opt.get()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void joinRoom(String roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));
        
        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new BadRequestException("User is already a member of this room");
        }
        
        RoomMember member = RoomMember.builder()
                .roomId(roomId)
                .userId(userId)
                .role(RoomMember.MemberRole.MEMBER)
                .build();
        
        roomMemberRepository.save(member);
        log.info("User {} joined room {}", userId, roomId);
    }

    @Transactional
    public void leaveRoom(String roomId, Long userId) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new ResourceNotFoundException("User is not a member of this room");
        }
        
        roomMemberRepository.deleteByRoomIdAndUserId(roomId, userId);
        log.info("User {} left room {}", userId, roomId);
    }

    public List<Long> getRoomMembers(String roomId) {
        return roomMemberRepository.findUserIdsByRoomId(roomId);
    }

    public boolean isMember(String roomId, Long userId) {
        return roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
    }

    private RoomResponse mapToRoomResponse(ChatRoom room) {
        int memberCount = roomMemberRepository.countMembersByRoomId(room.getRoomId());
        
        return RoomResponse.builder()
                .id(room.getId())
                .roomId(room.getRoomId())
                .name(room.getName())
                .description(room.getDescription())
                .type(room.getType())
                .createdBy(room.getCreatedBy())
                .isActive(room.getIsActive())
                .memberCount(memberCount)
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}
