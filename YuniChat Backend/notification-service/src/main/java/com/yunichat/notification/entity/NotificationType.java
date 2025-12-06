package com.yunichat.notification.entity;

public enum NotificationType {
    // Friend Request Notifications
    FRIEND_REQUEST("Friend Request", "You have a new friend request"),
    FRIEND_ACCEPT("Friend Accepted", "Your friend request was accepted"),
    FRIEND_REJECT("Friend Rejected", "Your friend request was declined"),
    
    // Message Notifications
    NEW_MESSAGE("New Message", "You have a new message"),
    NEW_GROUP_MESSAGE("New Group Message", "New message in group"),
    MENTIONED("Mentioned", "You were mentioned in a message"),
    
    // Group Notifications
    GROUP_INVITE("Group Invitation", "You were added to a group"),
    GROUP_LEAVE("Member Left", "A member left the group"),
    GROUP_JOIN("Member Joined", "A new member joined"),
    
    // System Notifications
    SYSTEM("System Notification", "System message"),
    ANNOUNCEMENT("Announcement", "Important announcement"),
    WARNING("Warning", "Warning message"),
    MAINTENANCE("Maintenance", "System maintenance notification"),
    
    // User Activity
    USER_ONLINE("User Online", "A user is now online"),
    USER_OFFLINE("User Offline", "A user went offline"),
    
    // Other
    CUSTOM("Custom", "Custom notification");

    private final String displayName;
    private final String defaultMessage;

    NotificationType(String displayName, String defaultMessage) {
        this.displayName = displayName;
        this.defaultMessage = defaultMessage;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
