import React, { FunctionComponent, useMemo } from 'react';
import { capitalize } from 'lodash';
import { Chip, Tooltip } from '@material-ui/core';
import {
  HourglassEmpty,
  HourglassFull,
  CheckCircleOutline,
  ErrorOutline,
  PauseCircleFilled,
  PauseCircleOutline,
  RemoveCircle,
  RemoveCircleOutline,
  Help
} from '@material-ui/icons';
import message from '../utils/message';
import { useTranslation } from "react-i18next";

interface Props {
  job: any;
}

const JobStatus: FunctionComponent<Props> = ({ job }) => {
  const {t} = useTranslation();
  const status = useMemo<string>(() => job['jobStatus'], [job]);
  const icon = useMemo(() =>
    status === 'unapproved' ? <HourglassEmpty/>
    : status === 'queued' ? <HourglassEmpty/>
    : status === 'scheduling' ? <HourglassEmpty/>
    : status === 'running' ? <HourglassFull/>
    : status === 'finished' ? <CheckCircleOutline/>
    : status === 'failed' ? <ErrorOutline/>
    : status === 'pausing' ? <PauseCircleFilled/>
    : status === 'paused' ? <PauseCircleOutline/>
    : status === 'killing' ? <RemoveCircle/>
    : status === 'killed' ? <RemoveCircleOutline/>
    : <Help/>
  , [status]);
  const label = capitalize(t('components.'+status));
  const detail = useMemo<Array<any>>(() => job['jobStatusDetail'], [job]);
  const splitMessage = (msg:string)=>{
    let arr = []
    let stack = []
    let cur = ''
    for(let char of msg){
        if(char==='{'){
            if(cur){
                arr.push(cur)
                cur = '{'
            }
        }
        else if(char==='}'){
            if(cur){
                cur+=char
                arr.push(cur)
                cur = ''
            }
        }
        else{
            cur += char
        }
    }
    if(cur){
        arr.push(cur)
    }
    return arr
}
  const title = useMemo(() => {
    if (!Array.isArray(detail)) return null;
    if (detail.length === 0) return null;
    const firstDetail = detail[0];
    if (typeof firstDetail !== 'object') return null;
    const firstDetailMessage = firstDetail.message;
    if (typeof firstDetailMessage === 'string') {
      const idx1 = firstDetailMessage.indexOf('20');
      const idx2 = firstDetailMessage.indexOf('+');
      if (idx1 > -1 && idx2 > -1) {
        // todo
        const oldStr = firstDetailMessage.slice(idx1, idx2);
        const time = new Date(`${oldStr}+00:00`).toLocaleString('en');
        const temp1 = firstDetailMessage.split(oldStr);
        const temp2 = firstDetailMessage.split(temp1[1]);
        const msg = `${t('components.'+temp1[0])}${time}${temp2[1]}`;
        return msg;
      }
      let arr = splitMessage(firstDetailMessage);
      return t('components.'+arr[0])+arr[1]+t('components.'+arr[2])+arr[3];
    };
    if (typeof firstDetailMessage === 'object') return (
      <pre>{JSON.stringify(firstDetailMessage, null, 2)}</pre>
    );
    return <pre>{JSON.stringify(firstDetail, null, 2)}</pre>;
  }, [detail]);
  return (
    <Tooltip title={title as React.ReactElement} placement="right" interactive>
      <Chip icon={icon} label={label}/>
    </Tooltip>
  );
}

export default JobStatus;
