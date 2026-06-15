package com.courseenglish.api.cache;

import java.time.Duration;
import java.util.Optional;

public interface RedisCacheOperations {

    Optional<String> getRaw(String key);

    void setRaw(String key, String value, Duration ttl);

    void delete(String key);

    boolean tryLock(String lockKey, Duration ttl);

    void unlock(String lockKey);
}
