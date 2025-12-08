import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
} from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

export function login(email, password) {
    return new Promise((resolve, reject) => {
        const authDetails = new AuthenticationDetails({
            Username: email,
            Password: password,
        });

        const user = new CognitoUser({
            Username: email,
            Pool: userPool,
        });

        user.authenticateUser(authDetails, {
            onSuccess: (result) => {
                const token = result.getAccessToken().getJwtToken();
                localStorage.setItem("token", token);
                resolve(token);
            },
            onFailure: (err) => reject(err),
        });
    });
}

export function logout() {
    localStorage.removeItem("token");
    userPool.getCurrentUser()?.signOut();
}

export function getCurrentUser() {
    const user = userPool.getCurrentUser();
    if (!user) return null;

    return new Promise((resolve, reject) => {
        user.getSession((err, session) => {
            if (err || !session.isValid()) {
                reject(null);
            } else {
                resolve(user);
            }
        });
    });
}
