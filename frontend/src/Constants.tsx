import axios from "axios";

const PROD_API_HOST = 'http://furbaby-prod-pr.eba-f3mkhigp.us-east-1.elasticbeanstalk.com';
const LOCAL_API_HOST = 'http://localhost:8000';

export const API_HOST = process.env.NODE_ENV === 'development' ? LOCAL_API_HOST : PROD_API_HOST;

axios.defaults.baseURL = API_HOST;
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.xsrfCookieName = 'csrftoken';
