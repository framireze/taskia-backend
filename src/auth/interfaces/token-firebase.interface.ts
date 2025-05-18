export interface TokenGoogle {
    name:           string;
    picture:        string;
    iss:            string;
    aud:            string;
    auth_time:      number;
    user_id:        string;
    sub:            string;
    iat:            number;
    exp:            number;
    email:          string;
    email_verified: boolean;
    firebase:       Firebase;
    uid:            string;
}

export interface Firebase {
    identities:       Identities;
    sign_in_provider: string;
}

export interface Identities {
    "google.com": string[];
    email:        string[];
}
