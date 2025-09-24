# API Monitoring Implementation Roadmap

## Overview
This document outlines the three-phase approach to implementing comprehensive API monitoring for the WIGG application to prevent performance issues like the "million calls" problem.

## Short-Term: Automated CI/CD Monitoring ✅ COMPLETED

**Branch**: `monitoring/short-term-playwright-api`

### Implementation
- **Playwright API Performance Tests**: Automated tests that monitor API call patterns during CI/CD
- **GitHub Actions Integration**: API monitoring runs before Lighthouse CI
- **Threshold Enforcement**: Configurable limits for different endpoint types
- **Real-time Detection**: Identifies rapid-fire calls and infinite loop patterns

### Results
- Successfully detected 118 excessive calls to `/title_metrics` endpoint
- Average 7.25ms between calls (indicating potential infinite loop)
- Automated failure of CI builds when limits exceeded

### Files Added
- `tests/api-performance.spec.ts` - Main monitoring test
- `playwright.config.ts` - Configuration for API testing
- `.github/workflows/lhci.yml` - Enhanced with API monitoring

### Thresholds Set
- Auth endpoints: < 5 calls
- WIGG data endpoints: < 10 calls
- General endpoints: < 20 calls
- Total API calls: < 50 calls

## Mid-Term: React Query Migration & DevTools

**Branch**: `monitoring/mid-term-react-query`

### Goals
- Migrate `useUserWiggs` and `useTitleMetrics` to React Query
- Implement React Query DevTools for development monitoring
- Add automatic caching and deduplication
- Reduce API calls by 80-90% through proper state management

### Benefits
- **Automatic Deduplication**: Multiple components won't duplicate API calls
- **Built-in Caching**: Prevents redundant requests
- **Background Refetching**: Controlled refresh behavior
- **DevTools Integration**: Real-time monitoring in development

### Implementation Plan
```typescript
// Convert from manual useEffect to React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['userWiggs', titleId, user?.id],
  queryFn: () => fetchUserWiggs(titleId, user.id),
  staleTime: 5 * 60 * 1000, // 5 minutes
  enabled: !!titleId && !!user
});
```

### Files to Modify
- `src/hooks/useUserWiggs.ts` - Convert to React Query
- `src/hooks/useTitleMetrics.ts` - Convert to React Query
- `src/main.tsx` - Add React Query DevTools

## Long-Term: Production Monitoring & Analytics

**Branch**: `monitoring/long-term-production`

### Goals
- Implement Sentry Performance Monitoring
- Add custom telemetry for API usage patterns
- Set up alerting for production performance issues
- Create dashboards for API usage analytics

### Components
1. **Sentry Integration**
   ```typescript
   Sentry.init({
     integrations: [
       new Sentry.BrowserTracing({
         traceFetch: true,
         traceXHR: true,
       }),
     ],
     tracesSampleRate: 1.0,
   });
   ```

2. **Custom API Telemetry**
   - Track API response times
   - Monitor error rates
   - Detect usage patterns
   - User journey analytics

3. **Alerting System**
   - Slack/email notifications for performance issues
   - Threshold-based alerts
   - Trend analysis for gradual degradation

4. **Analytics Dashboard**
   - Real-time API usage metrics
   - Performance trend visualization
   - User behavior insights
   - Cost optimization recommendations

### Integration Points
- Vercel Analytics (already installed)
- Supabase monitoring dashboard
- Custom metrics collection
- Error tracking and reporting

## Success Metrics

### Short-Term ✅
- [x] CI/CD catches API performance regressions
- [x] Automated testing prevents infinite loops
- [x] Build failures for excessive API calls

### Mid-Term (Target)
- [ ] 80-90% reduction in redundant API calls
- [ ] Real-time development monitoring
- [ ] Automatic caching and deduplication

### Long-Term (Target)
- [ ] Production performance alerting
- [ ] API usage analytics and optimization
- [ ] Proactive issue detection and resolution

## Branch Strategy

```
main
├── monitoring/short-term-playwright-api    (✅ Completed)
├── monitoring/mid-term-react-query         (🚧 In Progress)
└── monitoring/long-term-production         (📋 Planned)
```

Each branch builds upon the previous one, creating a comprehensive monitoring ecosystem that prevents performance issues at every stage of development and deployment.