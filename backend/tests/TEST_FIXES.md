# Test Execution Fixes

## Issues Fixed

### 1. Firebase/Firestore Import Issues
**Problem:** Tests were trying to import Firebase modules which attempted to access SSL certificates, causing permission errors.

**Solution:**
- Added comprehensive Firebase mocking in `conftest.py` before any imports
- Mocked all Firebase-related modules (`firebase_admin`, `google.auth`, `requests`, etc.)
- Set test environment variables before imports

### 2. FirestoreDB Import Issues
**Problem:** Test files were importing `FirestoreDB` which tried to initialize Firebase.

**Solution:**
- Wrapped imports in `with patch()` blocks to mock FirestoreDB before import
- Updated test files to properly mock collections

### 3. Too Many Nested Blocks
**Problem:** `test_client` fixture had too many nested `with` statements causing syntax error.

**Solution:**
- Simplified `test_client` fixture
- Created separate `mock_collection` fixture
- Reduced nesting levels

### 4. Test Configuration
**Solution:**
- Created `backend/tests/pytest.ini` with proper configuration
- Added test markers for better organization
- Configured environment variables for testing

## How to Run Tests

### Run All Tests
```bash
cd backend
pytest tests/ -v
```

### Run Specific Test File
```bash
cd backend
pytest tests/unit/test_nfc_security.py -v
```

### Run with Coverage
```bash
cd backend
pytest tests/ -v --cov=. --cov-report=html
```

## Mocking Strategy

### Firebase/Firestore
- All Firebase modules are mocked in `conftest.py` before any imports
- FirestoreDB is mocked at module level in test files
- Collections are mocked with AsyncMock for async operations

### Collections
- Each collection is mocked with:
  - `find_one()` - AsyncMock returning None or test data
  - `find()` - AsyncMock returning empty list or test data
  - `insert_one()` - AsyncMock
  - `update_one()` - AsyncMock
  - `delete_one()` - AsyncMock
  - `count_documents()` - AsyncMock returning 0

## Test Environment Variables

Set in `conftest.py`:
- `ENV=test`
- `FIREBASE_PROJECT_ID=test-project`
- `JWT_SECRET=test-secret-key-minimum-32-characters-long-for-testing`
- `NFC_SECRET_KEY=test-nfc-secret-key-for-testing`

## Known Limitations

1. Some integration tests may need actual Firebase connection (marked with `@pytest.mark.requires_firebase`)
2. E2E tests require running server (use `pytest.mark.e2e` to skip in CI)
3. Some tests may need additional mocking for complex scenarios

## Next Steps

1. Run tests to verify fixes
2. Add more comprehensive mocking for edge cases
3. Set up test database for integration tests
4. Add test data fixtures


