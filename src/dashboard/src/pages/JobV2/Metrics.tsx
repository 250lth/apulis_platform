import React, {
  FunctionComponent,
  useContext,
  useMemo
} from 'react';
import {
  Card,
  CardMedia
} from '@material-ui/core';

import Context from './Context';

const Metrics: FunctionComponent = () => {
  const { cluster, job } = useContext(Context);
  const url = useMemo(() => {
    return `${cluster['grafana']}/dashboard/db/job-status?var-job_id=${encodeURIComponent(job['jobId'])}&kiosk=tv`;
  }, [cluster, job]);

  return (
    <Card>
      <CardMedia
        component="iframe"
        src={url}
        height="1536"
        frameBorder="0"
      />
    </Card>
  )
}

export default Metrics;
