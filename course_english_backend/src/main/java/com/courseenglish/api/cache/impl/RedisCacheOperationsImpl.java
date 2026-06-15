package com.courseenglish.api.cache.impl;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.courseenglish.api.cache.RedisCacheOperations;
import com.courseenglish.api.config.RedisProperties;

@Service
@ConditionalOnProperty(prefix = "app.redis", name = "enabled", havingValue = "true")
public class RedisCacheOperationsImpl implements RedisCacheOperations {

    private static final Logger log = LoggerFactory.getLogger(RedisCacheOperationsImpl.class);

    private final RedisTemplate<String, String> redis;
    private final RedisProperties props;

    public RedisCacheOperationsImpl(RedisTemplate<String, String> redis, RedisProperties props) {
        this.redis = redis;
        this.props = props;
    }

    @Override
    public Optional<String> getRaw(String key) {
        try {
            return Optional.ofNullable(redis.opsForValue().get(key));
        } catch (Exception ex) {
            log.warn("Redis GET failed key={}: {}", key, ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public void setRaw(String key, String value, Duration ttl) {
        try {
            redis.opsForValue().set(key, value, ttlWithJitter(ttl));
        } catch (Exception ex) {
            log.warn("Redis SET failed key={}: {}", key, ex.getMessage());
        }
    }

    @Override
    public void delete(String key) {
        try {
            redis.delete(key);
        } catch (Exception ex) {
            log.warn("Redis DEL failed key={}: {}", key, ex.getMessage());
        }
    }

    @Override
    public boolean tryLock(String lockKey, Duration ttl) {
        try {
            Boolean acquired = redis.opsForValue().setIfAbsent(lockKey, "1", ttlWithJitter(ttl));
            return Boolean.TRUE.equals(acquired);
        } catch (Exception ex) {
            log.warn("Redis lock failed key={}: {}", lockKey, ex.getMessage());
            return true;
        }
    }

    @Override
    public void unlock(String lockKey) {
        delete(lockKey);
    }

    private Duration ttlWithJitter(Duration ttl) {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            return Duration.ofSeconds(60);
        }
        long baseSeconds = ttl.getSeconds();
        double jitter = props.getTtlJitterRatio();
        long extra = (long) (baseSeconds * jitter * ThreadLocalRandom.current().nextDouble());
        return Duration.ofSeconds(baseSeconds + extra);
    }
}
