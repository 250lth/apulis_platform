import React, {
  FunctionComponent,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Button, TextField } from '@material-ui/core';
import { useSnackbar } from 'notistack';
import ClusterContext from './ClusterContext';
import AuthContext from '../../contexts/Auth';
import { useTranslation } from "react-i18next";



interface Props {
  job: any;
  isMy?: boolean;
}

const PriorityField: FunctionComponent<Props> = ({ job, isMy }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { cluster } = useContext(ClusterContext);
  const { permissionList = [] } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [textFieldDisabled, setTextFieldDisabled] = useState(false);
  // const input = useRef<HTMLInputElement>();
  const buttonEnabled = useMemo(() => {
    return (
      // job['jobStatus'] === 'running' ||
      job['jobStatus'] === 'queued' ||
      job['jobStatus'] === 'scheduling' ||
      job['jobStatus'] === 'unapproved' ||
      job['jobStatus'] === 'paused' ||
      job['jobStatus'] === 'pausing'
    )
  }, [job])
  const [priority, setPriority] = useState(Number(job['priority']) || 100);
  const onBlur = (event: any) => {
    setEditing(false);
    const val = priority < 1 ? 1 : priority > 1000 ? 1000 : priority;
    setPriority(val);
    if (val === job['priority']) return;
    enqueueSnackbar(t('jobsV2.priorityIsBeingSet'));
    setTextFieldDisabled(true);

    fetch(`/api/clusters/${cluster.id}/jobs/${job['jobId']}/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priority: val }),
      headers: { 'Content-Type': 'application/json' }
    }).then((response) => {
      if (response.ok) {
        enqueueSnackbar(t('jobsV2.priorityIsSetSuccessfully'), { variant: 'success' });
      } else {
        throw Error();
      }
      setEditing(false);
    }).catch(() => {
      enqueueSnackbar(t('jobsV2.failedToSetPriority'), { variant: 'error' });
    }).then(() => {
      setTextFieldDisabled(false);
    });
  }

  if (editing) {
    return (
      <TextField
        // inputRef={input}
        type="number"
        value={priority}
        disabled={textFieldDisabled || (isMy ? false : !permissionList.includes('VIEW_AND_MANAGE_ALL_USERS_JOB'))}
        fullWidth
        onBlur={onBlur}
        onChange={e => setPriority(Number(e.target.value))}
      />
    );
  } else {
    return (
      <Button
        fullWidth
        variant={buttonEnabled ? 'outlined' : 'text'}
        onClick={buttonEnabled ? () => setEditing(true) : undefined}
        disabled={isMy ? false : !permissionList.includes('VIEW_AND_MANAGE_ALL_USERS_JOB')}
      >
        {priority}
      </Button>
    );
  }
};

export default PriorityField;
