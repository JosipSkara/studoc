import { Amplify } from "aws-amplify";

Amplify.configure({
    Auth: {
        region: import.meta.env.VITE_AWS_REGION,
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        oauth: {
            domain: import.meta.env.VITE_COGNITO_DOMAIN.replace("https://", ""),
            scope: ["email", "openid", "profile"],
            redirectSignIn: import.meta.env.VITE_REDIRECT_URI,
            redirectSignOut: import.meta.env.VITE_LOGOUT_URI,
            responseType: "code",
        },
    },
});
