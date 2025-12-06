package com.yunichat.user.repository;

import com.yunichat.user.entity.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserReportRepository extends JpaRepository<UserReport, Long> {
    
    List<UserReport> findByReporterUserId(Long reporterUserId);
    
    List<UserReport> findByReportedUserId(Long reportedUserId);
    
    List<UserReport> findByStatus(UserReport.ReportStatus status);
    
    void deleteByReporterUserIdOrReportedUserId(Long reporterUserId, Long reportedUserId);
}
