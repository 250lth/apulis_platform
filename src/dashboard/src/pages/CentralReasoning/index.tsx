import React, { useState, FC, useEffect, useMemo, useContext } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, TextField, 
  MenuItem } from "@material-ui/core";
import MaterialTable, { Column, Options } from 'material-table';
import { renderDate, sortDate, renderId, renderStatus } from '../JobsV2/tableUtils';
import SelectTree from '../CommonComponents/SelectTree';
import { useForm } from "react-hook-form";
import ClusterContext from '../../contexts/Clusters';
import TeamsContext from '../../contexts/Teams';
import useActions from "../../hooks/useActions";
import { NameReg, NameErrorText } from '../../const';
import axios from 'axios';
import message from '../../utils/message';

const CentralReasoning: React.FC = () => {
  const { selectedCluster, availbleGpu } = useContext(ClusterContext);
  const { selectedTeam } = useContext(TeamsContext);
  const [pageSize, setPageSize] = useState(10);
  const [jobs, setJobs] = useState([]);
  const [allSupportInference, setAllSupportInference] = useState<any[]>([]);
  const [framework, setFramework] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [modalFlag, setModalFlag] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const { handleSubmit, register, getValues, errors, setValue, clearError, setError } = useForm({ mode: "onBlur" });
  const { kill } = useActions(selectedCluster);
  const actions = [kill];
  const _renderId = (job: any) => renderId(job, 0);
  const _renderURL = (job: any) => <p title={job['inference-url']} style={{maxWidth: '300px'}}>{job['inference-url']}</p>;
  const columns = useMemo<Array<Column<any>>>(() => [
    { title: 'Id', type: 'string', field: 'jobId',
    render: _renderId, disableClick: true, sorting: false, cellStyle: {fontFamily: 'Lucida Console', width: '360px'}},
    { title: 'Jobname', type: 'string', field: 'jobName', sorting: false},
    { title: 'Username', type: 'string', field: 'userName'},
    { title: 'Path', type: 'string', field: 'jobParams.model_base_path', sorting: false },
    { title: 'Framework', type: 'string', field: 'Framework', sorting: false },
    { title: 'DeviceType', type: 'string', field: 'DeviceType', sorting: false },
    { title: 'Status', type: 'string', field: 'jobStatus', sorting: false, render: renderStatus },
    { title: 'URL', type: 'string', field: 'inference-url', sorting: false, render: _renderURL}
  ], []);
  const options = useMemo<Options>(() => ({
    padding: 'dense',
    actionsColumnIndex: -1,
    pageSize
  }), [pageSize]);

  useEffect(() => {
    getData();
  }, [selectedCluster, selectedTeam]);

  const getData = () => {
    axios.get(`/clusters/${selectedCluster}/teams/${selectedTeam}/inferenceJobs?limit=999`)
      .then(res => {
        const { data } = res;
        setJobs(data);
      }, () => {
        message('error', `Failed to fetch jobs from cluster: ${selectedCluster}`);
      })
  }
 
  const onSubmit = async (val: any) => {
    setBtnLoading(true);
    await axios.post(`/clusters/${selectedCluster}/teams/${selectedTeam}/postInferenceJob`, {
      ...val,
      framework: framework,
      device: deviceType,
      image: allSupportInference.find(i => i.framework === framework).image
    }).then((res) => {
      message('success', `Reasoning successfully！`);
      setModalFlag(false);
      getData();
    },  () => {
      message('error', `Reasoning failed！`);
    })
    setBtnLoading(false);
  }

  const openModal = () => {
    setModalFlag(true);
    axios.get(`/${selectedCluster}/getAllSupportInference`)
    .then(res => {
      const { data } = res;
      setAllSupportInference(data);
      setFramework(data[0].framework);
      setDeviceType(data[0].device[0]);
    })
  }

  const getFrameworkOptions = () => {
    if (allSupportInference) {
      return allSupportInference.map(i => <MenuItem value={i.framework}>{i.framework}</MenuItem>)
    } else {
      return null;
    }
  }

  const getDeviceTypeOptions = () => {
    if (framework) {
      const arr = allSupportInference.find(i => i.framework === framework).device;
      return arr.map((i: any) => <MenuItem value={i}>{i}</MenuItem>)
    } else {
      return null;
    }
  }

  return (
    <div className="modelList">
      <MaterialTable
        title={
          <Button variant="contained" color="primary" onClick={openModal}>
            New Reasoning
          </Button>
        }
        columns={columns}
        data={jobs}
        options={options}
        actions={actions}
        onChangeRowsPerPage={(pageSize: any) => setPageSize(pageSize)}
      />
      {modalFlag && 
      <Dialog open={modalFlag} disableBackdropClick fullWidth>
        <DialogTitle>New Reasoning</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <TextField
              label="Job Name"
              name="jobName"
              fullWidth
              variant="filled"
              error={Boolean(errors.jobName)}
              helperText={errors.jobName ? errors.jobName.message : ''}
              InputLabelProps={{ shrink: true }}
              inputProps={{ maxLength: 20 }}
              style={{ margin: '10px 0' }}
              inputRef={register({
                required: 'Job Name is required！',
                pattern: {
                  value: NameReg,
                  message: NameErrorText
                }
              })}
            />
            <TextField
              label="Path"
              name="model_base_path"
              fullWidth
              variant="filled"
              error={Boolean(errors.model_base_path)}
              helperText={errors.model_base_path ? errors.model_base_path.message : ''}
              InputLabelProps={{ shrink: true }}
              style={{ margin: '10px 0' }}
              inputRef={register({
                required: 'Path is required！',
              })}
            />
            <TextField
              select
              label="Framework"
              name="framework"
              fullWidth
              onChange={e => setFramework(e.target.value)}
              variant="filled"
              style={{ margin: '10px 0' }}
              value={framework}
              InputLabelProps={{ shrink: true }}
            >
              {getFrameworkOptions()}
            </TextField>
            {framework && <TextField
              select
              label="Device Type"
              name="device"
              fullWidth
              onChange={e => setDeviceType(e.target.value)}
              variant="filled"
              value={deviceType}
              style={{ margin: '10px 0' }}
            >
              {getDeviceTypeOptions()}
            </TextField>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalFlag(false)} color="primary" variant="outlined">Cancel</Button>
            <Button type="submit" color="primary" disabled={btnLoading} variant="contained" style={{ marginLeft: 8 }}>
              {btnLoading && <CircularProgress size={20}/>}Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>}
    </div>
  ); 
};

export default CentralReasoning;
