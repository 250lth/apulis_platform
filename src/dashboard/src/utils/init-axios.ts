import axios, {AxiosError, AxiosResponse, AxiosRequestConfig} from 'axios';
import { VariantType } from 'notistack';
import { History } from 'history';

import { initMessage } from './message'
export interface Message {
  (type: VariantType, msg: string): void;
}

let message: Message = (type: VariantType, msg: string) => {
  //
}

let history: History;

axios.interceptors.request.use((ruquest: AxiosRequestConfig) => {
  // TODO: JWT auth
  return ruquest;
});


axios.interceptors.response.use((response: AxiosResponse) => {
  return response;
}, (error: AxiosError) => {
  if (error.response) {
    const { status } = error.response;
    if (status === 400) {
      message('error', '查询参数错误，请检查');
    } else  if (status === 401) {
      message('error', '未登录，请登录');
      history.push('/sign-in');
    } else if (status === 403) {
      message('error', '无相关权限，请检查登录账户信息');
    } else if (status === 500) {
      message('error', '服务器程序错误');
    } else if (status === 502) {
      message('error', '网关错误');
    }
  } else {
    //
  }
  
  return Promise.reject(error)
});


const initAxios = (msg: Message, h: History<any>) => {
  message = msg;
  history = h;
  initMessage(msg);
}




export default initAxios;