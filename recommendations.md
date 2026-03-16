# Scaling Recommendations & Architectural Assumptions

This document outlines how the FX Trading App can scale to millions of users and documents the core architectural assumptions made during the implementation.

## Scaling to Millions of Users

### 1. Asynchronous Processing with Queues
Currently, ledger entries and audit logs are created synchronously within the database transaction. 
- **Recommendation**: Implement **BullMQ** or **RabbitMQ** to offload non-critical side effects (email notifications, secondary audit logging, analytic events) to background workers. This reduces API response times and increases system throughput.

### 2. Database Read Replicas & Sharding
The `transactions` and `ledger_entries` tables will grow extremely fast.
- **Recommendation**: 
    - Use **Read Replicas** for query-heavy operations like fetching history or balances.
    - Implement **Horizontal Sharding** (e.g., partitioning users by ID) to distribute write load and reduce lock contention on the primary database.

### 3. Distributed Redis Cluster
- **Recommendation**: Move from a single Redis instance to a **Redis Cluster**. This ensures high availability for FX rate caching and idempotency keys, preventing the cache layer from becoming a single point of failure.

### 4. Microservices Decomposition
- **Recommendation**: Split the `FX Module` (which handles high-frequency polling and external I/O) from the `Wallet Module` (which handles core ledger writes), or still maintain it as one of the modules and use a queue to update it. This allows the FX service to scale independently in high-traffic regions. Also if multiple of this instance runs, it's important to have a leader election that elects a leader, so we do not have same cron run on different instances.

### 5. Event Sourcing for Financial Integrity
- **Recommendation**: Transition from a state-based balance model to an **Event-Sourced** model. Every financial movement becomes an immutable event. The current balance is just a "projection" of these events. This provides an absolute audit trail and simplifies complex multi-currency reconciliations.

### 6. Multi-Tier Rate Limiting
- **Recommendation**: Implement rate limiting at the **API Gateway** level (e.g., Nginx) to protect the backend from burst traffic and potential DDoS attacks on expensive financial endpoints.

### 7. Multi-Provider FX Aggregation
- **Recommendation**: Implement a "Fallback Aggregator" that connects to multiple FX providers. This ensures the system always has a source of truth for rates even if one provider's API goes down or becomes unstable.

### 8. Observability & Real-Time Alerts
- **Recommendation**: Integrate **Prometheus/Grafana** for metrics and **ELK/Datadog** for structured logging. Set up real-time alerts for transaction failure spikes, excessive database lock wait times, and FX API latency.

---

## Architectural Assumptions

### 1. System Wallet Identifier
- **Assumption**: The system pool wallet is identified by a reserved nil UUID (`00000000-0000-0000-0000-000000000000`). This is necessary because the `userId` column in the database is strictly typed as a UUID, preventing the use of strings like "SYSTEM".

### 2. FX Rate Validity Window
- **Assumption**: Rates are considered valid for a 5-minute window while cached in Redis.
- **Risk**: In high-volatility markets, this could lead to arbitrage risks. A production-grade system would use a "Quote" system where a rate is locked for <30 seconds for a specific transaction.

### 3. Double-Entry Ledger Liquidity
- **Assumption**: We assume the **System Pool Wallets** have sufficient liquidity for funding operations (initialized with a large balance). In a real fintech environment, these would be managed by a Treasury module with actual bank-linked liquidity.

### 4. Concurrency Control
- **Assumption**: The use of `SERIALIZABLE` isolation is the safest default for ensuring ledger integrity.
- **Scale Note**: At huge scale, the system might move to `READ COMMITTED` with granular application-level locks to improve performance.

### 5. Decimal Precision
- **Assumption**: All financial calculations use `numeric(20,8)` to ensure precision for highly fractional currencies and to avoid floating-point errors.
