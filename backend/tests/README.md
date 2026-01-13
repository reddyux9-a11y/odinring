# Backend Tests

## Test Execution Fixes

### Issues Fixed

1. **Firebase/Firestore Mocking**
   - All Firebase modules are mocked in `conftest.py` before any imports
   - Prevents SSL certificate access issues
   - Mocked modules: `firebase_admin`, `google.auth`, `requests`, etc.

2. **FirestoreDB Mocking**
   - FirestoreDB class is mocked at module level
   - Collections are mocked with AsyncMock for async operations
   - Prevents Firebase initialization during imports

3. **Test Configuration**
   - Created `pytest.ini` with proper configuration
   - Added test markers for organization
   - Set environment variables for testing

### Running Tests

```bash
# Run all tests
cd backend
pytest tests/ -v

# Run specific test file
pytest tests/unit/test_nfc_security.py -v

# Run with coverage
pytest tests/ -v --cov=. --cov-report=html
```

### Test Structure

- `tests/unit/` - Unit tests for individual modules
- `tests/integration/` - Integration tests for API endpoints
- `tests/e2e/` - End-to-end tests for complete flows

### Mocking Strategy

All external dependencies are mocked:
- Firebase/Firestore
- Database collections
- External APIs
- File system operations

### Known Limitations

1. **System-Level Permissions**
   - Some tests may still encounter permission errors on certain systems
   - This is due to Python's SSL certificate loading at the system level
   - Workaround: Run tests in CI/CD or with proper permissions

2. **Integration Tests**
   - Some integration tests may need actual Firebase connection
   - Mark with `@pytest.mark.requires_firebase` to skip in unit test runs

3. **E2E Tests**
   - Require running server
   - Mark with `@pytest.mark.e2e` to skip in CI

### Test Markers

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.e2e` - End-to-end tests
- `@pytest.mark.security` - Security-related tests
- `@pytest.mark.requires_firebase` - Tests requiring Firebase

### Environment Variables

Set automatically in `conftest.py`:
- `ENV=test`
- `FIREBASE_PROJECT_ID=test-project`
- `JWT_SECRET=test-secret-key-minimum-32-characters-long-for-testing`
- `NFC_SECRET_KEY=test-nfc-secret-key-for-testing`


