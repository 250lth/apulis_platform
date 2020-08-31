import React from "react";

import { MenuItem, TextField } from "@material-ui/core";
import { BaseTextFieldProps } from "@material-ui/core/TextField";

import ClustersContext from "../../../contexts/Clusters";
import TeamsContext from "../../../contexts/Teams";
import useFetch from "use-http";
import _ from "lodash";
import {sumValues} from "../../../utlities/ObjUtlities";

interface ClusterSelectFieldProps {
  cluster: string | undefined;
  onClusterChange(value: string): void;
  gpuType?: string;
  onAvailbleGpuNumChange?(val1: number, val2: number): void;
}

const ClusterSelectField: React.FC<ClusterSelectFieldProps & BaseTextFieldProps> = (
  { cluster, onClusterChange, variant="standard", ...props }
) => {
  const { clusters,selectedCluster, saveSelectedCluster } = React.useContext(ClustersContext);
  const { selectedTeam } = React.useContext(TeamsContext);
  const fetchVcStatusUrl = `/api`;
  const[helperText, setHelperText] = React.useState('');

  const request = useFetch(fetchVcStatusUrl);
  const fetchVC = async () => {
    const response = await request.get(`/teams/${selectedTeam}/clusters/${selectedCluster}`);
    return response;
  }
  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      saveSelectedCluster(event.target.value);
    },
    [saveSelectedCluster]
  );
  const isEmpty = (obj: object) => {
    if (obj === undefined) return true;
    for(let key in obj) {
      if(obj.hasOwnProperty(key))
        return false;
    }
    return true;
  }
  React.useEffect(() => {
    fetchVC().then((res)=>{
      let clusterName = props.gpuType || '';
      if (!isEmpty(res)) {
        if (!clusterName) {
          clusterName = (String)(Object.keys(res['gpu_capacity'])[0]);
        }
      }
      const gpuCapacity = isEmpty(res) ? 0 : res['gpu_capacity'][clusterName] || 0;
      const gpuAvailable = isEmpty(res) ? 0 : res['gpu_avaliable'][clusterName] || 0;
      const maxQuota = isEmpty(res) ? 0 : JSON.parse(res.quota)[clusterName] || 0;
      const _gpuAvailable = Math.max(gpuAvailable, maxQuota);
      props.onAvailbleGpuNumChange && props.onAvailbleGpuNumChange(gpuCapacity, _gpuAvailable);
      setHelperText(`${clusterName} (${_gpuAvailable} / ${gpuCapacity} to use)`);
    })
    if (selectedCluster) {
      onClusterChange(selectedCluster);
    }
  }, [clusters, onClusterChange, selectedCluster, props.gpuType]);

  if (cluster === undefined) {
    return null;
  }

  return (
    <TextField
      select
      label="Cluster"
      helperText={helperText}
      value={cluster}
      onChange={onChange}
      variant="filled"
      {...props}
    >
      {//const filterclusters = clusters.filter((cluster)=>(boolean)cluster["admin"]);
        clusters && _.map(clusters,'id').map(cluster => (
          <MenuItem key={cluster} value={cluster}>{cluster}</MenuItem>
        ))
      }
    </TextField>
  );
}

export default ClusterSelectField;
