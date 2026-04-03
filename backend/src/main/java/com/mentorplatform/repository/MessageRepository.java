package com.mentorplatform.repository;

import com.mentorplatform.entity.Message;
import com.mentorplatform.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findBySessionOrderBySentAtAsc(Session session);
    List<Message> findBySessionIdOrderBySentAtAsc(UUID sessionId);
}
