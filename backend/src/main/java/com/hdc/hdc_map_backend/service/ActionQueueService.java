package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.model.MapAction;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ActionQueueService {

    private static final Logger logger = LoggerFactory.getLogger(ActionQueueService.class);

    // Store action queues per session ID
    private final Map<String, ActionQueue> sessionQueues = new ConcurrentHashMap<>();

    public static class ActionQueue {
        private final List<MapAction> actions;
        private int currentIndex = 0;
        private final String sessionId;

        public ActionQueue(String sessionId, List<MapAction> actions) {
            this.sessionId = sessionId;
            this.actions = new ArrayList<>(actions);
            logger.info("Created action queue for session {} with {} actions", sessionId, actions.size());
        }

        public MapAction getCurrentAction() {
            if (currentIndex < actions.size()) {
                return actions.get(currentIndex);
            }
            return null;
        }

        public MapAction getNextAction() {
            currentIndex++;
            if (currentIndex < actions.size()) {
                logger.info("Session {} advancing to action {} of {}", sessionId, currentIndex + 1, actions.size());
                return actions.get(currentIndex);
            }
            logger.info("Session {} has completed all {} actions", sessionId, actions.size());
            return null;
        }

        public boolean hasNextAction() {
            return currentIndex + 1 < actions.size();
        }

        public boolean isComplete() {
            return currentIndex >= actions.size();
        }

        public int getCurrentIndex() {
            return currentIndex;
        }

        public int getTotalActions() {
            return actions.size();
        }

        public List<MapAction> getAllActions() {
            return new ArrayList<>(actions);
        }
    }

    /**
     * Create a new action queue for a session
     */
    public void createActionQueue(String sessionId, List<MapAction> actions) {
        if (actions == null || actions.isEmpty()) {
            logger.warn("Attempted to create empty action queue for session {}", sessionId);
            return;
        }

        ActionQueue queue = new ActionQueue(sessionId, actions);
        sessionQueues.put(sessionId, queue);
        logger.info("Created action queue for session {} with {} actions", sessionId, actions.size());
    }

    /**
     * Get the first action for a session (called when user makes initial request)
     */
    public MapAction getFirstAction(String sessionId) {
        ActionQueue queue = sessionQueues.get(sessionId);
        if (queue == null) {
            logger.warn("No action queue found for session {}", sessionId);
            return null;
        }

        MapAction firstAction = queue.getCurrentAction();
        if (firstAction != null) {
            logger.info("Returning first action for session {}: {} (sequence {})",
                       sessionId, firstAction.getType(), firstAction.getSequenceId());
        }
        return firstAction;
    }

    /**
     * Mark current action as completed and get next action
     */
    public MapAction completeCurrentAndGetNext(String sessionId, int completedSequenceId) {
        ActionQueue queue = sessionQueues.get(sessionId);
        if (queue == null) {
            logger.warn("No action queue found for session {}", sessionId);
            return null;
        }

        MapAction currentAction = queue.getCurrentAction();
        if (currentAction == null || currentAction.getSequenceId() != completedSequenceId) {
            logger.warn("Current action mismatch for session {}. Expected sequence {}, got {}",
                       sessionId, currentAction != null ? currentAction.getSequenceId() : "null", completedSequenceId);
            return null;
        }

        logger.info("Session {} completed action {}: {}", sessionId, completedSequenceId, currentAction.getType());

        MapAction nextAction = queue.getNextAction();
        if (nextAction != null) {
            logger.info("Session {} next action: {} (sequence {})",
                       sessionId, nextAction.getType(), nextAction.getSequenceId());
        } else {
            logger.info("Session {} has completed all actions", sessionId);
            cleanupSession(sessionId);
        }

        return nextAction;
    }

    /**
     * Get current action for a session
     */
    public MapAction getCurrentAction(String sessionId) {
        ActionQueue queue = sessionQueues.get(sessionId);
        return queue != null ? queue.getCurrentAction() : null;
    }

    /**
     * Get progress information for a session
     */
    public Map<String, Object> getProgress(String sessionId) {
        ActionQueue queue = sessionQueues.get(sessionId);
        if (queue == null) {
            return Map.of("error", "No active action queue for session");
        }

        return Map.of(
            "currentIndex", queue.getCurrentIndex(),
            "totalActions", queue.getTotalActions(),
            "isComplete", queue.isComplete(),
            "hasNext", queue.hasNextAction(),
            "currentAction", queue.getCurrentAction() != null ? queue.getCurrentAction().getType() : null
        );
    }

    /**
     * Check if session has an active queue
     */
    public boolean hasActiveQueue(String sessionId) {
        return sessionQueues.containsKey(sessionId) && !sessionQueues.get(sessionId).isComplete();
    }

    /**
     * Clear action queue for a session
     */
    public void cleanupSession(String sessionId) {
        ActionQueue removed = sessionQueues.remove(sessionId);
        if (removed != null) {
            logger.info("Cleaned up action queue for session {}", sessionId);
        }
    }

    /**
     * Get all actions for a session (for debugging)
     */
    public List<MapAction> getAllActions(String sessionId) {
        ActionQueue queue = sessionQueues.get(sessionId);
        return queue != null ? queue.getAllActions() : new ArrayList<>();
    }
}