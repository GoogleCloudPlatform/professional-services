// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package handler

import (
	// Uncomment these imports if re-enabling Firebase OAuth validation below
	// "context"
	// "log/slog"
	"net/http"
	// "strings"

	"firebase.google.com/go/v4/auth"
)

type authContextKeyType string

const UserContextKey authContextKeyType = "firebase_user"

// AuthMiddleware handles request routing. It is configured here to bypass token verification
// for local development / logic-only mode.
//
// TO RE-ENABLE OAUTH / FIREBASE VERIFICATION:
//  1. Uncomment the "context", "log/slog", and "strings" packages in the imports block above.
//  2. Remove the bypass lines below (next.ServeHTTP and return).
//  3. Uncomment the commented code block containing the token extraction, verification,
//     and domain constraints.
func AuthMiddleware(authClient *auth.Client, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// BYPASS AUTHENTICATION
		// Forwards the request immediately without token verification.
		next.ServeHTTP(w, r)
		return

		/*
			// Bypass auth in local tests if authClient is nil (graceful fallback for unit tests)
			if authClient == nil {
				next.ServeHTTP(w, r)
				return
			}

			var tokenStr string

			// 1. Try to extract token from query parameter (for WebSockets)
			if tokenParam := r.URL.Query().Get("token"); tokenParam != "" {
				tokenStr = tokenParam
			} else {
				// 2. Try to extract token from Authorization header (for normal API calls)
				authHeader := r.Header.Get("Authorization")
				if strings.HasPrefix(authHeader, "Bearer ") {
					tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
				}
			}

			if tokenStr == "" {
				slog.Warn("Authentication failed: missing token")
				http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
				return
			}

			// 3. Verify ID Token with Firebase
			token, err := authClient.VerifyIDToken(r.Context(), tokenStr)
			if err != nil {
				slog.Error("Authentication failed: invalid token", slog.String("error", err.Error()))
				http.Error(w, "Unauthorized: invalid token", http.StatusUnauthorized)
				return
			}

			// 4. Enforce domain constraint server-side (unbypassable!)
			email, ok := token.Claims["email"].(string)
			isValidDomain := ok && (strings.HasSuffix(email, "@google.com") || strings.HasSuffix(email, "@demart.altostrat.com"))
			if !isValidDomain {
				slog.Warn("Authentication failed: domain not authorized", slog.String("email", email))
				http.Error(w, "Unauthorized: restricted to authorized domains only", http.StatusForbidden)
				return
			}

			// 5. Inject validated token info into request context
			ctx := context.WithValue(r.Context(), UserContextKey, token)
			next.ServeHTTP(w, r.WithContext(ctx))
		*/
	})
}
