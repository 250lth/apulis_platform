import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Grid,
  Container,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Chip,
  Collapse,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
  MenuItem,
  SvgIcon, useMediaQuery
} from "@material-ui/core";
import axios from 'axios';
import Tooltip from '@material-ui/core/Tooltip';
import { Info, Delete, Add, PortraitSharp, ImportExportTwoTone } from "@material-ui/icons";
import { withRouter } from "react-router";
import IconButton from '@material-ui/core/IconButton';
import { useSnackbar } from 'notistack';
import useFetch from "use-http";
import { join } from 'path';
import _ from "lodash";
import ClusterSelectField from "./components/ClusterSelectField";
import UserContext from "../../contexts/User";
import ClustersContext from '../../contexts/Clusters';
import TeamsContext from "../../contexts/Teams";
import theme, { Provider as MonospacedThemeProvider } from "../../contexts/MonospacedTheme";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList} from "recharts";
import Paper, { PaperProps } from '@material-ui/core/Paper';
import Draggable from 'react-draggable'
import {TransitionProps} from "@material-ui/core/transitions";
import Slide from "@material-ui/core/Slide";
import {green, grey, red} from "@material-ui/core/colors";
import {DLTSDialog} from "../CommonComponents/DLTSDialog";
import {
  SUCCESSFULSUBMITTED,
  SUCCESSFULTEMPLATEDELETE, SUCCESSFULTEMPLATEDSAVE
} from "../../Constants/WarnConstants";
import {DLTSSnackbar} from "../CommonComponents/DLTSSnackbar";
import message from '../../utils/message';
import { NameReg, NameErrorText } from '../../const';
import './Training.less';

interface EnvironmentVariable {
  name: string;
  value: string;
}

const sanitizePath = (path: string) => {
  path = join('/', path);
  path = join('.', path);
  return path;
}
const Training: React.ComponentClass = withRouter(({ history }) => {
  const { selectedCluster,saveSelectedCluster, availbleGpu } = React.useContext(ClustersContext);
  const { userName, uid } = React.useContext(UserContext);
  const { teams, selectedTeam }= React.useContext(TeamsContext);
  const { enqueueSnackbar } = useSnackbar()
  //const team = 'platform';
  const [showGPUFragmentation, setShowGPUFragmentation] = useState(false)
  const [grafanaUrl, setGrafanaUrl] = useState('');
  const [name, setName] = useState("");
  const [gpuFragmentation, setGpuFragmentation] = useState<any[]>([]);
  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
  };
  const team = useMemo(() => {
    if (teams == null) return;
    if (selectedTeam == null) return;
    return teams.filter((team: any) => team.id === selectedTeam)[0];
  }, [teams, selectedTeam]);
  const cluster = useMemo(() => {
    if (team == null) return;
    if (selectedCluster == null) return;
    return team.clusters.filter((cluster: any) => cluster.id === selectedCluster)[0];
  }, [team, selectedCluster]);
  const gpuModel = useMemo(() => {
    if (cluster == null) return;
    return Object.keys(cluster.gpus)[0];
  }, [cluster]);
  const [gpuType, setGpuType] = useState(availbleGpu![0].type || '');
  const [gpusPerNode, setGpusPerNode] = useState(0)
  const [templates, setTemplates] = useState([{name: '', json: ''}]);
  
  useEffect(() => {
    axios.get(`/teams/${selectedTeam}/templates`)
      .then(res => {
        setTemplates(res.data)
      })
  }, [selectedTeam]);

  const [type, setType] = useState("RegularJob");
  const onTypeChange = React.useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      setType(event.target.value as string);
    },
    [setType]
  );

  const [preemptible, setPreemptible] = useState(false);
  const onPreemptibleChange = React.useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      setPreemptible(event.target.value === 'true');
    },
    [setPreemptible]
  );
  const onGpuTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGpuType(event.target.value);
  };

  const [workers, setWorkers] = useState(0);
  const onWorkersChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.valueAsNumber || 0;
      if (value < 0) { value = 0; }
      if (value > 0) { value = 26; }
      setWorkers(event.target.valueAsNumber);
    },
    [setWorkers]
  );

  const [image, setImage] = useState("");
  const onImageChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setImage(event.target.value);
    },
    [setImage]
  );

  const [command, setCommand] = useState("");
  const onCommandChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCommand(event.target.value);
    },
    [setCommand]
  );

  const [interactivePorts, setInteractivePorts] = useState("");
  const onInteractivePortsChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInteractivePorts(event.target.value);
    },
    [setInteractivePorts]
  );

  const [ssh, setSsh] = useState(false);
  const onSshChange = React.useCallback(
    (event: unknown, checked: boolean) => {
      setSsh(checked);
    },
    [setSsh]
  );

  const [ipython, setIpython] = useState(false);
  const onIpythonChange = React.useCallback(
    (event: unknown, checked: boolean) => {
      setIpython(checked);
    },
    [setIpython]
  );

  const [tensorboard, setTensorboard] = useState(false);
  const onTensorboardChange = React.useCallback(
    (event: unknown, checked: boolean) => {
      setTensorboard(checked);
    },
    [setTensorboard]
  );

  const [advanced, setAdvanced] = useState(false);
  const onAdvancedClick = () => {
    setAdvanced(!advanced);
  }
  const [accountName, setAccountName] = useState("");
  const [accountKey, setAccountKey] = useState("");
  const [containerName, setContainerName] = useState("");
  const [mountPath, setMountPath] = useState("");
  const [mountOptions, setMountOptions] = useState("");
  const onAccountNameChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAccountName(event.target.value);
    },
    [setAccountName]
  )
  const onAccountKeyChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAccountKey(event.target.value);
    },
    [setAccountKey]
  )
  const onContainerNameChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setContainerName(event.target.value);
    },
    [setContainerName]
  )
  const onMountPathChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMountPath(event.target.value);
    },
    [setMountPath]
  )
  const onMountOptionsChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMountOptions(event.target.value);
    },
    [setMountOptions]
  )
  const [workPath, setWorkPath] = useState("");
  const onWorkPathChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setWorkPath(event.target.value);
    },
    [setWorkPath]
  )
  const [dockerRegistry, setDockerRegistry] = useState("");
  const [dockerUsername, setDockerUsername] = useState("");
  const [dockerPassword, setDockerPassword] = useState("");
  const onDockerRegistryChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDockerRegistry(event.target.value)
    },
    [setDockerRegistry]
  )
  const onDockerUsernameChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDockerUsername(event.target.value)
    },
    [setDockerUsername]
  )
  const onDockerPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDockerPassword(event.target.value)
    },
    [setDockerPassword]
  )
  const [enableWorkPath, setEnableWorkPath] = useState(true);
  const onEnableWorkPathChange = React.useCallback(
    (event: unknown, checked: boolean) => {
      setEnableWorkPath(checked);
    },
    [setEnableWorkPath]
  );

  const [dataPath, setDataPath] = useState("");
  const onDataPathChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDataPath(event.target.value);
    },
    [setDataPath]
  )

  const [enableDataPath, setEnableDataPath] = useState(true);
  const onEnableDataPathChange = React.useCallback(
    (event: unknown, checked: boolean) => {
      setEnableDataPath(checked);
    },
    [setEnableDataPath]
  );

  const [jobPath, setJobPath] = useState("");

  const onJobPathChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setJobPath(value);
    },
    [setJobPath]
  )

  const [enableJobPath, setEnableJobPath] = useState(true);
  const onEnableJobPathChange = React.useCallback(
    (event: unknown, checked: boolean) => {
      setEnableJobPath(checked);
    },
    [setEnableJobPath]
  );
  const [showSaveTemplate, setSaveTemplate] = useState(false);
  const [environmentVariables, setEnvironmentVariables] = useState<EnvironmentVariable[]>([]);
  const onEnvironmentVariableNameChange = React.useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const newEnvironmentVariables = environmentVariables.slice()
      environmentVariables[index].name = event.target.value;
      setEnvironmentVariables(newEnvironmentVariables);
    },
    [environmentVariables]
  );
  const onEnvironmentVariableValueChange = React.useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const newEnvironmentVariables = environmentVariables.slice()
      environmentVariables[index].value = event.target.value;
      setEnvironmentVariables(newEnvironmentVariables);
    },
    [environmentVariables]
  );
  const onRemoveEnvironmentVariableClick = React.useCallback(
    (index: number) => () => {
      const newEnvironmentVariables = environmentVariables.slice();
      newEnvironmentVariables.splice(index, 1);
      setEnvironmentVariables(newEnvironmentVariables)
    },
    [environmentVariables]
  )
  const onAddEnvironmentVariableClick = React.useCallback(() => {
    setEnvironmentVariables(
      environmentVariables.concat(
        [{ name: "", value: "" }]));
  }, [environmentVariables]);

  const [database, setDatabase] = useState(false);
  // const onDatabaseClick = React.useCallback(() => {
  //   setDatabase(true);
  // }, []);
  const onTemplateClick = () => {
    setDatabase(!database);
  }


  const [saveTemplateName, setSaveTemplateName] = useState("");
  const onSaveTemplateNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSaveTemplateName(event.target.value);
  };

  const [saveTemplateDatabase, setSaveTemplateDatabase] = useState("user");
  const onSaveTemplateDatabaseChange = React.useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      setSaveTemplateDatabase((event.target.value) as string);
    },
    [setSaveTemplateDatabase]
  );

  const [iconInfoShow, setIconInfoShow] = useState(false);

  const [gpus, setGpus] = useState(0);
  const submittable = useMemo(() => {
    if (!gpuModel) return false;
    if (!selectedTeam) return false;
    if (!name || !NameReg.test(name)) return false;
    if (!image) return false;
    if (!command.trim()) return false;
    if (type === 'RegularJob' && gpus > gpusPerNode) return false;
    if (/^\d+$/.test(name)) return false;

    return true;
  }, [gpuModel, selectedTeam, name, image, command, type, gpus, gpusPerNode]);
  const onSaveTemplateClick = async () => {
    if (!saveTemplateName) {
      message('error', 'Need input template name')
      return
    }
    try {
      let plugins: any = {};
      plugins['blobfuse'] = [];

      let blobfuseObj: any = {};
      blobfuseObj['accountName'] = accountName || '';
      blobfuseObj['accountKey'] = accountKey || '';
      blobfuseObj['containerName'] = containerName || '';
      blobfuseObj['mountPath'] = mountPath || '';
      blobfuseObj['mountOptions'] = mountOptions || '';
      plugins['blobfuse'].push(blobfuseObj);

      plugins['imagePull'] = [];
      let imagePullObj: any = {};
      imagePullObj['registry'] = dockerRegistry
      imagePullObj['username'] = dockerUsername
      imagePullObj['password'] = dockerPassword
      plugins['imagePull'].push(imagePullObj)

      const template = {
        name,
        type,
        gpus,
        workers,
        image,
        command,
        workPath,
        enableWorkPath,
        dataPath,
        enableDataPath,
        jobPath,
        enableJobPath,
        environmentVariables,
        ssh,
        ipython,
        tensorboard,
        plugins,
        gpuType,
        preemptible
      };
      const url = `/teams/${selectedTeam}/templates/${saveTemplateName}?database=${saveTemplateDatabase}`;
      await axios.put(url, template);
      setSaveTemplate(true);
      // window.location.reload();
    } catch (error) {
      enqueueSnackbar('Failed to save the template', {
        variant: 'error',
      })
      console.error(error);
    }
  };
  const [showDeleteTemplate, setShowDeleteTemplate] = useState(false)

  const onDeleteTemplateClick = async () => {
    if (!saveTemplateName) {
      message('error', 'Need input template name')
      return
    }
    try {
      let dataBase = saveTemplateDatabase;
      if (dataBase === 'team') {
        dataBase = 'vc';
      }
      const url = `/teams/${selectedTeam}/templates/${saveTemplateName}?database=${dataBase}`;
      await axios.delete(url);
      setShowDeleteTemplate(true)
      // window.location.reload()
    } catch (error) {
      enqueueSnackbar('Failed to delete the template', {
        variant: 'error',
      })
      // alert('Failed to delete the template, check console (F12) for technical details.')
      console.error(error);
    }
  }

  const [json, setJson] = useState('');
  const [selectTPName, setSelectTPName] = useState('None (Apply a Template)');
  const onTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'None (Apply a Template)') {
      setName("");
      setType("RegularJob");
      setGpus(0);
      setWorkers(0);
      setImage("");
      setCommand("");
      setWorkPath("");
      setEnableWorkPath(true);
      setDataPath("");
      setEnableDataPath(true);
      setJobPath("");
      setEnableJobPath(true);
      setEnvironmentVariables([]);
      setSsh(false);
      setIpython(false);
      setTensorboard(false);
      setGpuType(availbleGpu![0].type || '')
      setPreemptible(false);
      setSelectTPName(val);
    } else {
      const {
        name,
        type,
        gpus,
        workers,
        image,
        command,
        workPath,
        enableWorkPath,
        dataPath,
        enableDataPath,
        jobPath,
        enableJobPath,
        environmentVariables,
        ssh,
        ipython,
        tensorboard,
        plugins,
        gpuType,
        preemptible
      } = JSON.parse(templates.find(i => i.name === val)!.json);
      if (name !== undefined) setName(name);
      if (type !== undefined) setType(type);
      if (gpus !== undefined) setGpus(gpus);
      if (workers !== undefined) setWorkers(workers);
      if (image !== undefined) setImage(image);
      if (command !== undefined) setCommand(command);
      if (workPath !== undefined) setWorkPath(workPath);
      if (enableWorkPath !== undefined) setEnableWorkPath(enableWorkPath);
      if (dataPath !== undefined) setDataPath(dataPath);
      if (enableDataPath !== undefined) setEnableDataPath(enableDataPath);
      if (jobPath !== undefined) setJobPath(jobPath);
      if (enableJobPath !== undefined) setEnableJobPath(enableJobPath);
      if (environmentVariables !== undefined) setEnvironmentVariables(environmentVariables);
      if (ssh !== undefined) setSsh(ssh);
      if (ipython !== undefined) setIpython(ipython);
      if (tensorboard !== undefined) setTensorboard(tensorboard);
      if (gpuType !== undefined) setGpuType(gpuType);
      if (preemptible !== undefined) setPreemptible(preemptible);
      // console.log('preemptible', preemptible)
      if (plugins === undefined) {
        setAccountName("");
        setAccountKey("");
        setContainerName("");
        setMountPath("");
        setMountOptions("");
        setDockerRegistry("")
        setDockerUsername("")
        setDockerPassword("")
      }
      if (plugins !== undefined) {
        if (plugins.hasOwnProperty("blobfuse") && Array.isArray(plugins['blobfuse'])) {
          let blobfuseObj = plugins['blobfuse'][0];
          setAccountName(blobfuseObj['accountName']);
          setAccountKey(blobfuseObj['accountKey']);
          setContainerName(blobfuseObj['containerName']);
          setMountPath(blobfuseObj['mountPath']);
          setMountOptions(blobfuseObj['mountOptions']);
        }

        if (plugins.hasOwnProperty('imagePull') && Array.isArray(plugins['imagePull'])) {
          let imagePullObj = plugins['imagePull'][0];
          setDockerRegistry(imagePullObj['registry'])
          setDockerUsername(imagePullObj['username'])
          setDockerPassword(imagePullObj['password'])
        }
      }
    }
    setSelectTPName(val);
    setJson(templates.find(i => i.name === val)!.json);
  }

  const {
    data: postJobData,
    loading: postJobLoading,
    error: postJobError,
    post: postJob,
  } = useFetch('/api');
  const {
    data: postEndpointsData,
    loading: postEndpointsLoading,
    error: postEndpointsError,
    post: postEndpoints,
  } = useFetch('/api');



  const [enableSubmit, setEnableSubmit] = useState(submittable);

  const onGpusChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.valueAsNumber || 0;
      if (value < 0) { value = 0; }
      if (value > 0) { value = 26; }
      setGpus(event.target.valueAsNumber);
      setEnableSubmit(false)
      if (type === 'RegularJob' && event.target.valueAsNumber > gpusPerNode)  {
        setEnableSubmit(true);
      }
    },
    [gpusPerNode, type]
  );
  const [open, setOpen] = useState(false);
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // if (!submittable) return;
    let plugins: any = {};
    plugins['blobfuse'] = [];
    let blobfuseObj: any = {};
    blobfuseObj['accountName'] = accountName || '';
    blobfuseObj['accountKey'] = accountKey || '';
    blobfuseObj['containerName'] = containerName || '';
    blobfuseObj['mountPath'] = mountPath || '';
    blobfuseObj['mountOptions'] = mountOptions || '';
    plugins['blobfuse'].push(blobfuseObj);
    plugins['imagePull'] = [];
    let imagePullObj: any = {};
    imagePullObj['registry'] = dockerRegistry
    imagePullObj['username'] = dockerUsername
    imagePullObj['password'] = dockerPassword
    plugins['imagePull'].push(imagePullObj)
    const job: any = {
      userName: userName,
      userId: uid,
      jobType: 'training',
      gpuType: gpuType,
      vcName: selectedTeam,
      containerUserId: 0,
      jobName: name,
      jobtrainingtype: type,
      preemptionAllowed: preemptible ? 'True' : 'False',
      image,
      cmd: command,
      workPath: sanitizePath(workPath || ''),
      enableworkpath: enableWorkPath,
      dataPath: sanitizePath(dataPath || ''),
      enabledatapath: enableDataPath,
      jobPath: sanitizePath(jobPath || ''),
      enablejobpath: enableJobPath,
      env: environmentVariables,
      hostNetwork : type === 'PSDistJob',
      isPrivileged : type === 'PSDistJob',
      interactivePorts: interactivePorts,
      plugins: plugins,
    };
    let totalGpus = Number(gpus) >= 0 ? Number(gpus) : 0;
    if (type === 'PSDistJob') {
      job.numps = 1;
      job.resourcegpu = gpusPerNode;
      job.numpsworker = workers;
      totalGpus = gpusPerNode * workers;
    } else {
      job.resourcegpu = Number(gpus) >= 0 ? Number(gpus) : 0;
    }

    // if (totalGpus > (cluster.userQuota)) {
    //   if (!window.confirm('Your job will be using gpus more than the quota.\nProceed?')) {
    //     return;
    //   }
    // }

    if (type === 'PSDistJob') {
      // Check GPU fragmentation
      let workersNeeded = workers;
      for (const { metric, value } of gpuFragmentation) {
        if (Number(metric['gpu_available']) >= gpusPerNode) {
          workersNeeded -= (Number(value[1]) || 0);
        }
        if (workersNeeded <= 0) break;
      }
      if (workersNeeded > 0) {
        if (!window.confirm('There won\'t be enough workers match your request.\nProceed?')) {
          return;
        }
      }
    }
    postJob(`/clusters/${selectedCluster}/jobs`, job);
  }; // Too many dependencies, do not cache.

  const jobId = React.useRef<string>();

  useEffect(() => {
    if (postJobData == null) return;
    if (postJobData.error) {
      enqueueSnackbar(postJobData.error, {
        variant: 'error'
      });
      return
    }

    jobId.current = postJobData['jobId'];
    const endpoints = [];
    for (const port of interactivePorts.split(',')) {
      const portNumber = Number(port)
      if (portNumber >= 40000 && portNumber <= 49999) {
        endpoints.push({
          name: `port-${portNumber}`,
          podPort: portNumber
        });
      }
    }
    console.log('endpoints', endpoints)

    if (ssh) endpoints.push('ssh');
    if (ipython) endpoints.push('ipython');
    if (tensorboard) endpoints.push('tensorboard');
    
    if (endpoints.length > 0) {
      postEndpoints(`/clusters/${selectedCluster}/jobs/${jobId.current}/endpoints`, { endpoints });
    } else {
      history.push(`/jobs-v2/${selectedCluster}/${jobId.current}`);
    }
  }, [postJobData]);

  const fetchGrafanaUrl = `/api/clusters`;
  const request = useFetch(fetchGrafanaUrl);
  const fetchGrafana = async () => {
    const result = await request.get(`/${selectedCluster}`);
    if (result) {
      const { grafana } = result
      setGrafanaUrl(grafana);
    }
  }
  const handleCloseGPUGramentation = () => {
    setShowGPUFragmentation(false);
  }

  useEffect(() => {
    fetchGrafana()
    if (postEndpointsData) {
      setOpen(true);
      setTimeout(()=>{
        history.push(`/jobs-v2/${selectedCluster}/${jobId.current}`);
      }, 2000)

    }
  }, [history, postEndpointsData, selectedCluster, selectedTeam])

  useEffect(() => {
    if (postJobError) {
      enqueueSnackbar('Job submission failed', {
        variant: 'error',
      })
    }
  }, [postJobError])

  useEffect(() => {
    if (postEndpointsError) {
      // alert('Enable endpoints failed')
      enqueueSnackbar('Enable endpoints failed', {
        variant: 'error',
      })
    }
  }, [postEndpointsError])


  const handleClickOpen = () => {
    setShowGPUFragmentation(true)
  }
  const handleClose = () => {
    setOpen(false)
    setSaveTemplate(false)
    setShowDeleteTemplate(false)
  }
  useEffect(() => {
    if (!grafanaUrl) return;
    let getNodeGpuAva = `${grafanaUrl}/api/datasources/proxy/1/api/v1/query?`;
    const params = new URLSearchParams({
      query:'count_values("gpu_available", k8s_node_gpu_available)'
    });
    fetch(getNodeGpuAva+params).then(async (res: any) => {
      const {data} = await res.json();
      const result = data['result'];
      const sortededResult = result.sort((a: any, b: any)=>a['metric']['gpu_available'] - b['metric']['gpu_available']);
      setGpuFragmentation(sortededResult)
    })
  }, [grafanaUrl])

  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  const showMessage = (open: boolean,showDeleteTemplate: boolean,showSaveTemplate: boolean) => {
    let message = '';
    if (open) {
      message = SUCCESSFULSUBMITTED;
    }
    if (showDeleteTemplate) {
      message = SUCCESSFULTEMPLATEDELETE;
    }
    if (showSaveTemplate) {
      message = SUCCESSFULTEMPLATEDSAVE;
    }
    return message;
  }
  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const radius = 10;
    return (
      <g>
        <circle cx={x + width / 2} cy={y - radius} r={radius} fill="#fff" />
        <text x={x + width / 2} y={y - radius} fill="#000" textAnchor="middle" dominantBaseline="middle">
          {value}
        </text>
      </g>
    );
  };
  const styleSnack={backgroundColor:showDeleteTemplate ? red[400] : green[400]};
  return (

    <Container maxWidth={isDesktop ? 'lg' : 'xs'}>
      <DLTSDialog open={showGPUFragmentation}
        message={null}
        handleClose={handleCloseGPUGramentation}
        handleConfirm={null} confirmBtnTxt={null} cancelBtnTxt={null}
        title={"View Cluster GPU Status Per Node"}
        titleStyle={{color:grey[400]}}
      >
        <BarChart width={500} height={600} data={gpuFragmentation}  margin={{top: 20}}>
          <CartesianGrid strokeDasharray="10 10"/>
          <XAxis dataKey={"metric['gpu_available']"} label={{value: 'Available gpu count', position:'insideBottomLeft'}}>
          </XAxis>
          <YAxis label={{value: 'Node count', angle: -90, position: 'insideLeft'}} allowDecimals={false} />
          <Bar dataKey="value[1]" fill="#8884d8" >
            <LabelList dataKey="value[1]" content={renderCustomizedLabel} />
          </Bar>
        </BarChart>
      </DLTSDialog>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader title="Submit Training Job"/>
          <Divider/>
          <CardContent>
            <Grid
              container
              wrap="wrap"
              spacing={1}
            >
              <Grid item xs={12} sm={6}>
                <ClusterSelectField
                  data-test="cluster-item"
                  fullWidth
                  cluster={selectedCluster}
                  gpuType={gpuType}
                  onClusterChange={saveSelectedCluster}
                  onAvailbleGpuNumChange={(value) => {setGpusPerNode(value)}}
                />
                <Tooltip title="View Cluster GPU Status Per Node">
                  <IconButton color="secondary" size="small" onClick={handleClickOpen} aria-label="delete">
                    <SvgIcon>
                      <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/><path fill="none" d="M0 0h24v24H0z"/>
                    </SvgIcon>
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Job Name"
                  name="jobName"
                  fullWidth
                  variant="filled"
                  value={name}
                  error={name ? !NameReg.test(name) : false}
                  onChange={onNameChange}
                  helperText={name ? !NameReg.test(name) ? NameErrorText : '' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  disabled={!Array.isArray(templates)}
                  select
                  label="Job Template"
                  fullWidth
                  variant="filled"
                  value={selectTPName}
                  onChange={onTemplateChange}
                >
                  <MenuItem value={'None (Apply a Template)'} divider>None (Apply a Template)</MenuItem>
                  {Array.isArray(templates) && templates.sort((a,b)=>a.name.localeCompare(b.name)).map(({ name, json }: any, index: number) => (
                    <MenuItem key={index} value={name}>{name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Job Type"
                  fullWidth
                  variant="filled"
                  value={type}
                  onChange={onTypeChange}
                >
                  <MenuItem value="RegularJob">Regular Job</MenuItem>
                  {/* <MenuItem value="PSDistJob">Distirbuted Job</MenuItem>
                  <MenuItem value="InferenceJob">Inference Job</MenuItem> */}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Preemptible Job"
                  fullWidth
                  variant="filled"
                  value={String(preemptible)}
                  onChange={onPreemptibleChange}
                >
                  <MenuItem value="false">NO</MenuItem>
                  <MenuItem value="true">YES</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Device Type"
                  fullWidth
                  variant="filled"
                  value={String(gpuType)}
                  onChange={onGpuTypeChange}
                >
                  {
                    availbleGpu?.map(gpu => (
                      <MenuItem value={gpu.type}>{gpu.type}</MenuItem>
                    ))
                  }
                  
                </TextField>
              </Grid>
              { (type === 'RegularJob' ||  type === 'InferenceJob') && (
                <Grid item xs={6}>
                  <TextField
                    type="number"
                    error={gpus > (type === 'InferenceJob' ? Number.MAX_VALUE : gpusPerNode)}
                    label="Number of Device"
                    fullWidth
                    variant="filled"
                    value={gpus}
                    onChange={onGpusChange}
                  />
                </Grid>
              )}
              { type === 'PSDistJob'  && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="number"
                    label="Number of Nodes"
                    fullWidth
                    variant="filled"
                    value={workers}
                    onChange={onWorkersChange}
                  />
                </Grid>
              )}
              { type === 'PSDistJob' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    disabled
                    type="number"
                    label="Total Number of Device"
                    value = {workers * gpusPerNode}
                    fullWidth
                    variant="filled"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  label="Docker Image"
                  fullWidth
                  variant="filled"
                  value={image}
                  error={!image}
                  onChange={onImageChange}
                />
              </Grid>
              <Grid item xs={12}>
                <MonospacedThemeProvider>
                  <TextField
                    multiline
                    label="Command"
                    fullWidth
                    variant="filled"
                    rows="10"
                    value={command}
                    onChange={onCommandChange}
                  />
                </MonospacedThemeProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Interactive Ports"
                  placeholder="40000 - 49999. Separated by comma."
                  fullWidth
                  variant="filled"
                  rows="10"
                  value={interactivePorts}
                  onChange={onInteractivePortsChange}
                />
              </Grid>
              <Grid item xs={4} container justify="center">
                <FormControlLabel
                  control={<Checkbox />}
                  label="SSH"
                  checked={ssh}
                  onChange={onSshChange}
                />
              </Grid>
              <Grid item xs={4} container justify="center">
                <FormControlLabel
                  control={<Checkbox />}
                  label="iPython"
                  checked={ipython}
                  onChange={onIpythonChange}
                />
              </Grid>
              <Grid item xs={4} container justify="center" className="icon-grid">
                <FormControlLabel
                  control={<Checkbox />}
                  label="Tensorboard"
                  checked={tensorboard}
                  onChange={onTensorboardChange}
                />
                <Info fontSize="small" onClick={() => setIconInfoShow(!iconInfoShow)} />
              </Grid>
              {iconInfoShow && <Grid item xs={12} container justify="flex-end">
                <Chip
                  icon={<Info/>}
                  label="Tensorboard will listen on directory ~/tensorboard/<JobId>/logs inside docker container."
                />
              </Grid>}
            </Grid>
          </CardContent>
          <Collapse in={advanced}>
            <Divider/>
            <CardContent>
              <Typography component="div" variant="h6" >Custom Docker Registry</Typography>
              <Grid
                container
                wrap="wrap"
                spacing={1}
                align-items-xs-baseline
              >
                <Grid item xs={12}>
                  <TextField
                    value={dockerRegistry}
                    onChange={onDockerRegistryChange}
                    label="Registry"
                    fullWidth
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    value={dockerUsername}
                    onChange={onDockerUsernameChange}
                    label="Username"
                    fullWidth
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    value={dockerPassword}
                    onChange={onDockerPasswordChange}
                    label="Password"
                    fullWidth
                    variant="filled"
                  />
                </Grid>
              </Grid>
            </CardContent>
            <CardContent>
              <Typography component="span" variant="h6">Mount Directories</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Path in Container</TableCell>
                    <TableCell>Path on Host Machine / Storage Server</TableCell>
                    <TableCell align="center">Enable</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>/work</TableCell>
                    <TableCell>
                      <TextField
                        label="Work Path"
                        fullWidth
                        margin="dense"
                        variant="filled"
                        value={workPath}
                        onChange={onWorkPathChange}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        value={enableWorkPath}
                        checked={enableWorkPath}
                        onChange={onEnableWorkPathChange}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>/data</TableCell>
                    <TableCell>
                      <TextField
                        label="Data Path"
                        fullWidth
                        margin="dense"
                        variant="filled"
                        value={dataPath}
                        onChange={onDataPathChange}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        value={enableDataPath}
                        checked={enableDataPath}
                        onChange={onEnableDataPathChange}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>/job</TableCell>
                    <TableCell>
                      <TextField
                        label="Job Path"
                        fullWidth
                        margin="dense"
                        variant="filled"
                        value={jobPath}
                        onChange={onJobPathChange}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        value={enableJobPath}
                        checked={enableJobPath}
                        onChange={onEnableJobPathChange}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardContent>
              <Typography component="span" variant="h6">Environment Variables</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell/>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    environmentVariables.map(({ name, value }, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            label="Environment Variable Name"
                            fullWidth
                            margin="dense"
                            variant="filled"
                            value={name}
                            onChange={onEnvironmentVariableNameChange(index)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            label="Environment Variable Value"
                            fullWidth
                            margin="dense"
                            variant="filled"
                            value={value}
                            onChange={onEnvironmentVariableValueChange(index)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="secondary" onClick={onRemoveEnvironmentVariableClick(index)}>
                            <Delete/>
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                  <TableRow>
                    <TableCell/>
                    <TableCell/>
                    <TableCell align="center">
                      <IconButton size="small" color="secondary" onClick={onAddEnvironmentVariableClick}>
                        <Add/>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Collapse>
          <Collapse in={database}>
            <Divider/>
            <CardContent>
              <Typography component="span" variant="h6">Template Management</Typography>
              <Grid container wrap="wrap" spacing={1}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Template name"
                    fullWidth
                    variant="filled"
                    value={saveTemplateName}
                    onChange={onSaveTemplateNameChange}
                  />
                </Grid>
                <Grid item xs>
                  <TextField
                    label="Scope"
                    select
                    fullWidth
                    variant="filled"
                    value={saveTemplateDatabase}
                    onChange={onSaveTemplateDatabaseChange}
                  >
                    <MenuItem value="user">user</MenuItem>
                    <MenuItem value="team">team</MenuItem>
                  </TextField>
                </Grid>
                <Button type="button" color="primary" onClick={onSaveTemplateClick}>Save</Button>
                <Button type="button" color="secondary" onClick={onDeleteTemplateClick}>Delete</Button>
              </Grid>
            </CardContent>
          </Collapse>
          <Divider/>
          <CardActions>
            <Grid item xs={12} container justify="space-between">
              <Grid item xs container>
                <Button type="button" color="secondary"  onClick={onAdvancedClick}>Advanced</Button>
                <Button type="button" color="secondary"  onClick={onTemplateClick}>Template</Button>
              </Grid>
              <Button type="submit" color="primary" variant="contained" disabled={enableSubmit || postJobLoading || postEndpointsLoading || open }>Submit</Button>
            </Grid>
          </CardActions>
        </Card>
      </form>
      <DLTSSnackbar message={showMessage(open,showDeleteTemplate,showSaveTemplate)}
        open={open || showSaveTemplate || showDeleteTemplate}
        style={styleSnack}
        handleWarnClose={handleClose}
        autoHideDuration={1000}
      />
    </Container>
  );
});

export default Training;
