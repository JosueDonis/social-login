const axios = require('axios').default

const getAccessTokenFromCode = async ({ type, code, social, redirect }) => {
    try {
        const stringifiedParams = queryString.stringify({
            social,
            redirect
        })
        if (social == 'google') {
            const input = {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.API_HOST}${process.env.API_ROOT}/social-login/callback${stringifiedParams ? "?" + stringifiedParams : ''}`,
                grant_type: 'authorization_code',
                code,
            }
            const { data } = await axios.post(`https://oauth2.googleapis.com/token`, input)
            return data
        }

        if (social == 'facebook') {
            const params = {
                client_id: process.env.FACEBOOK_CLIENT_ID,
                client_secret: process.env.FACEBOOK_CLIENT_SECRET,
                redirect_uri: `${process.env.API_HOST}${process.env.API_ROOT}/social-login/callback${stringifiedParams ? "?" + stringifiedParams : ''}`,
                code,
            }
            const { data } = await axios.get('https://graph.facebook.com/v4.0/oauth/access_token', { params });
            return data
        }

    } catch (error) {
        return Promise.reject(error)
    }
}

const googleUser = async ({ access_token, id_token }) => {
    try {
        const { data } = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
            {
                headers: {
                    Authorization: `Bearer ${id_token}`,
                },
            }
        )
        return data
    } catch (error) {
        return Promise.reject(error)
    }
}

const facebookUser = async ({ access_token }) => {
    try {
        const { data } = await axios({
            url: 'https://graph.facebook.com/me',
            method: 'get',
            params: {
                fields: ['id', 'email', 'first_name', 'last_name'].join(','),
                access_token,
            },
        })
        return data
    } catch (error) {
        return error
    }
};
const getUser = async ({ social, ...query }) => {
    try {
        const getToken = await getAccessTokenFromCode({ social, ...query, })
        if (social === 'google') return { token: getToken, ...await googleUser(getToken), }
        if (social === 'facebook') return { token: getToken, ...await facebookUser(getToken) }
        return null
    } catch (error) {
        return error
    }
}


const createSocialUser = async ({ query, user }) => {
    try {
        const now = new Date()
        const later = addMinutes(now, 5)
        let token = generateToken({ data: { email: user.email }, options: { exp: getUnixTime(later) } })
        let redirect = `${process.env.FRONTEND_URL}/social-login/${token}?${queryString.stringify({ redirect: query.redirect, social: query.social })}`
        
        //logic by create user with user auth with lib orm
        return { ...userCreate, redirect }
    } catch (error) {
        console.log("************* ERRROR")
        console.log(error)
    }
}


module.exports = {
    getAccessTokenFromCode,
    googleUser,
    facebookUser,
    getUser,
    createSocialUser
}
