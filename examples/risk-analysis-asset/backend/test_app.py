import unittest
from unittest.mock import patch, MagicMock
from app import app 
import json

class BackendTests(unittest.TestCase):
    
    def setUp(self):
        # Set up the test client
        self.app = app.test_client()
        self.app.testing = True

    @patch('app.id_token.verify_oauth2_token')  # Mock Google token verification
    @patch('app.db')  # Mock Firestore client
    def test_create_application_success(self, mock_db, mock_verify_token):
        # Mock the Firestore client and token verification
        mock_verify_token.return_value = {'email': 'test@example.com'}
        
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = 'mocked_id'  # Assign a mock ID to the document reference
        mock_doc_ref.set.return_value = None

        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Mock request payload
        payload = {
            "applicationName": "Test Application",
            "applicationDescription": "A test app description"
        }

        print("Mock Firestore client:", mock_db)
        print("Mock Firestore collection().document().set():", mock_db.collection.return_value.document.return_value.set)

        # Make POST request to create_application endpoint
        response = self.app.post('/api/apps',
                                 data=json.dumps(payload),
                                 content_type='application/json',
                                 headers={'Authorization': 'Bearer testtoken'})

        print("Response status code:", response.status_code)
        print("Response headers:", response.headers)
        print("Response data:", response.get_data(as_text=True))

        # Assert the response
        self.assertEqual(response.status_code, 201)
        self.assertIn('Application created successfully', response.get_data(as_text=True))

    @patch('app.id_token.verify_oauth2_token')  # Mock token verification
    @patch('app.db')  # Mock Firestore client
    def test_list_application_success(self, mock_db, mock_verify_token):
        # Mock the token verification
        mock_verify_token.return_value = {'email': 'test@example.com'}

        # Mock Firestore response
        mock_app_ref = MagicMock()
        mock_app_ref.stream.return_value = [
            MagicMock(to_dict=lambda: {'applicationName': 'App1', 'applicationDescription': 'Description1', 'CUJIds': '[]'}, id='app1'),  # Use MagicMock for documents
            MagicMock(to_dict=lambda: {'applicationName': 'App2', 'applicationDescription': 'Description2', 'CUJIds': '[]'}, id='app2')
        ]
        mock_db.collection.return_value = mock_app_ref
        # Make GET request to list_application endpoint
        response = self.app.get('/api/apps', headers={'Authorization': 'Bearer testtoken'})

        # Assert the response
        self.assertEqual(response.status_code, 200)
        print(f"test_list_application_success: {response.status_code}")
        self.assertIn('App1', response.get_data(as_text=True))
        self.assertIn('App2', response.get_data(as_text=True))

    @patch('app.id_token.verify_oauth2_token')  # Mock token verification
    def test_token_missing(self, mock_verify_token):
        # Test missing token scenario
        response = self.app.post('/api/apps',
                                 content_type='application/json')

        # Assert 403 status code
        self.assertEqual(response.status_code, 403)
        self.assertIn('Token is missing', response.get_data(as_text=True))

    @patch('app.id_token.verify_oauth2_token')  # Mock token verification
    @patch('app.db')  # Mock Firestore client
    def test_get_cuj_details_not_found(self, mock_db, mock_verify_token):
        # Mock the token verification
        mock_verify_token.return_value = {'email': 'test@example.com'}
        
        # Mock Firestore get for a non-existent CUJ
        mock_cuj_ref = MagicMock()
        mock_cuj_ref.get.return_value.exists = False
        mock_db.collection.return_value.document.return_value = mock_cuj_ref

        # Make GET request for a non-existent CUJ
        response = self.app.get('/api/cujs/123',
                                headers={'Authorization': 'Bearer testtoken'})

        # Assert 404 status code
        self.assertEqual(response.status_code, 404)
        self.assertIn('Critical User Journey not found', response.get_data(as_text=True))

    @patch('app.id_token.verify_oauth2_token')  # Mock token verification
    @patch('app.db')  # Mock Firestore client
    def test_update_risk_success(self, mock_db, mock_verify_token):
        # Mock token verification
        mock_verify_token.return_value = {'email': 'test@example.com'}

        # Mock Firestore get and update for the risk
        mock_risk_ref = MagicMock()
        mock_risk_doc = MagicMock()
        mock_risk_doc.exists = True
        mock_risk_doc.to_dict.return_value = {'badMinsData': 10, 'journeyID': ['cuj1']}
        mock_risk_ref.get.return_value = mock_risk_doc
        mock_db.collection.return_value.document.return_value = mock_risk_ref

        # Mock request payload
        payload = {
            'badMinsData': 20,
            'journeyID': ['cuj1']
        }

        # Make PUT request to update_risk endpoint
        response = self.app.put('/api/risks/123',
                                data=json.dumps(payload),
                                content_type='application/json',
                                headers={'Authorization': 'Bearer testtoken'})

        # Assert 200 status code and success message
        self.assertEqual(response.status_code, 200)
        self.assertIn('Risk updated successfully', response.get_data(as_text=True))

if __name__ == '__main__':
    unittest.main()
