import { useCallback, useContext } from 'react';
import { useSnackbar } from 'notistack';
import { Action } from 'material-table';
import ConfigContext from '../contexts/Config';
import UserContext from '../contexts/User';
import useConfirm from './useConfirm';
import { useTranslation } from "react-i18next";

const APPROVABLE_STATUSES = [
  'unapproved'
];
const PAUSABLE_STATUSES = [
  'queued',
  'scheduling',
  'running'
];
const RESUMABLE_STATUSES = [
  'paused'
];
const KILLABLE_STATUSES = [
  'unapproved',
  'queued',
  'scheduling',
  'running',
  'pausing',
  'paused'
];

const useActions = (clusterId: string) => {
  const {t} = useTranslation();
  const { userName, administrators } = useContext(UserContext);
  const supportMail = administrators![0];
  const confirm = useConfirm();
  const { enqueueSnackbar } = useSnackbar();
  const updateStatus = useCallback((jobId: string, status: string) => {
    const url = `/api/clusters/${clusterId}/jobs/${jobId}/status`;
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    })
  }, [clusterId]);

  const onSupport = useCallback((event: any, job: any) => {
    const subject = `[DLTS Job][${clusterId}][${job['vcName']}]: <Issue Title by User>`;
    const body = `
Hi DLTS support team,

There is some issue in my job ${window.location.origin}/jobs-v2/${encodeURIComponent(clusterId)}/${encodeURIComponent(job['jobId'])}

<Issue description by user>

Thanks,
${userName}
    `.trim();
    const link = `mailto:${supportMail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(link);
  }, [clusterId, supportMail]);

  const onApprove = useCallback((event: any, job: any) => {
    const title = `${job.jobName}(${job.jobId})`;
    return confirm(`Approve job ${title} ?`).then((answer) => {
      if (answer === false) return;

      enqueueSnackbar(`${title}${t('hooks.isBeingApproved')}`);
      return updateStatus(job.jobId, 'approved').then((response) => {
        if (response.ok) {
          enqueueSnackbar(`${title}${t('hooks.approveRequestIsAccepted')}`, { variant: 'success' });
        } else {
          enqueueSnackbar(`${title}${t('hooks.isFailedToApprove')}`, { variant: 'error' });
        }
      });
    });
  }, [confirm, enqueueSnackbar, updateStatus]);

  const onPause = useCallback((event: any, job: any) => {
    const title = `${job.jobName}(${job.jobId})`;
    return confirm(`${t('tips.pauseJob')} ${title} ?`).then((answer) => {
      if (answer === false) return;

      enqueueSnackbar(`${title} ${t('tips.isBeingPaused')}`);
      return updateStatus(job.jobId, 'pausing').then((response) => {
        if (response.ok) {
          enqueueSnackbar(`${title}${t('tips.pauseRequestAccepted')}`, { variant: 'success' });
        } else {
          enqueueSnackbar(`${title} ${t('tips.isFailedToPause')}`, { variant: 'error' });
        }
      });
    });
  }, [confirm, enqueueSnackbar, updateStatus]);

  const onResume = useCallback((event: any, job: any) => {
    const title = `${job.jobName}(${job.jobId})`;
    return confirm(`${t('tips.resumeJob')} ${title} ?`).then((answer) => {
      if (answer === false) return;

      enqueueSnackbar(`${title}${t('hooks.isBeingResumed')}`);
      return updateStatus(job.jobId, 'queued').then((response) => {
        if (response.ok) {
          enqueueSnackbar(`${title}${t('hooks.resumeRequestIsAccepted')}`, { variant: 'success' });
        } else {
          enqueueSnackbar(`${title}${t('hooks.isFailedToResume')}`, { variant: 'error' });
        }
      });
    });
  }, [confirm, enqueueSnackbar, updateStatus]);

  const onKill = useCallback((event: any, job: any) => {
    const title = `${job.jobName}(${job.jobId})`;
    return confirm(`${t('tips.killJob')} ${title} ?`).then((answer) => {
      if (answer === false) return;

      enqueueSnackbar(`${title}${t('hooks.isBeingKilled')}`);
      return updateStatus(job.jobId, 'killing').then((response) => {
        if (response.ok) {
          enqueueSnackbar(`${title}${t('hooks.killRequestIsAccepted')}`, { variant: 'success' });
        } else {
          enqueueSnackbar(`${title}${t('hooks.isFailedToKill')}`, { variant: 'error' });
        }
      });
    });
  }, [confirm, enqueueSnackbar, updateStatus]);

  const supportEmail = useCallback((job: any): Action<any> => {
    return {
      icon: 'help',
      tooltip: t('hooks.sendEmailForSupport'),
      onClick: onSupport
    };
  }, [onSupport]);

  const approve = useCallback((job: any): Action<any> => {
    const hidden = APPROVABLE_STATUSES.indexOf(job['jobStatus']) === -1;
    return {
      hidden,
      icon: 'check',
      tooltip: t('hooks.approve'),
      onClick: onApprove
    }
  }, [onApprove]);
  const pause = useCallback((job: any): Action<any> => {
    const hidden = PAUSABLE_STATUSES.indexOf(job['jobStatus']) === -1;
    return {
      hidden,
      icon: 'pause',
      tooltip: t('hooks.pause'),
      onClick: onPause
    }
  }, [onPause]);
  const resume = useCallback((job: any): Action<any> => {
    const hidden = RESUMABLE_STATUSES.indexOf(job['jobStatus']) === -1;
    return {
      hidden,
      icon: 'play_arrow',
      tooltip: t('hooks.resume'),
      onClick: onResume
    }
  }, [onResume]);
  const kill = useCallback((job: any): Action<any> => {
    const hidden = KILLABLE_STATUSES.indexOf(job['jobStatus']) === -1;
    return {
      hidden,
      icon: 'clear',
      tooltip: t('hooks.kill'),
      onClick: onKill
    }
  }, [onKill]);
  return { supportEmail, approve, pause, resume, kill };
}

export default useActions;
