import React, {useEffect, useState} from "react";
import { TransitionProps } from '@material-ui/core/transitions';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Grid,
  Container,
  TextField,
  Button,
  Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from "@material-ui/core";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import ClusterSelectField from "./components/ClusterSelectField";
import { DirectoryPathTextField } from '../Home/GPUCard'
import ClustersContext from "../../contexts/Clusters";
import UserContext from "../../contexts/User";
import TeamsContext from "../../contexts/Teams";
import {Link} from "react-router-dom";
import Slide, { SlideProps } from "@material-ui/core/Slide";
import {green} from "@material-ui/core/colors";
import useFetch from "use-http";
import formats from '../../Configuration/foldFormat.json';
const useStyles = makeStyles(() =>
  createStyles({
    container: {
      margin: "auto"
    },
    submitButton: {
      marginLeft: "auto"
    },
    dialogText: {
      color:green[400]
    }
  })
);

const Transition = React.forwardRef<unknown, TransitionProps>(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props as SlideProps} />;
});

const DataJob: React.FC = (props: any) => {
  const styles = useStyles();
  const [azureDataStorage, setAzureDataStorage] = useState('');
  const [nfsDataStorage, setNFSDataStorage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const[dialogContentText, setDialogContentText] = useState('');
  const [submittable, setSubmittable] = useState(!(formats.azureDataStorage && formats.nfsDataStorage));
  const {userName,uid } = React.useContext(UserContext);
  const {email} = React.useContext(UserContext);
  const {teams, selectedTeam} = React.useContext(TeamsContext);
  const { selectedCluster,saveSelectedCluster } = React.useContext(ClustersContext);
  const [workStorage, setWorkStorage ] = useState('');
  const [dataStorage, setDataStorage] = useState('');

  const team = React.useMemo(() => {
    if (teams == null) return;
    if (selectedTeam == null) return;
    return teams.filter((team: any) => team.id === selectedTeam)[0];
  }, [teams, selectedTeam]);
  const cluster = React.useMemo(() => {
    if (team == null) return;
    if (selectedCluster == null) return;
    return team.clusters.filter((cluster: any) => cluster.id === selectedCluster)[0];
  }, [team, selectedCluster]);
  const gpuModel = React.useMemo(() => {
    if (cluster == null) return;
    return Object.keys(cluster.gpus)[0];
  }, [cluster]);

  const handleClose = () => {
    setOpenDialog(false);
  }
  const fetchDiretoryUrl = `/api/clusters/${selectedCluster}`;
  const request = useFetch(fetchDiretoryUrl);
  const fetchStorage = async () => {
    const data = await request.get('/');
    const name = typeof userName === 'string' ?  userName.split('@', 1)[0] : userName;
    setDataStorage(data.dataStorage);
    setWorkStorage(`${data.workStorage}/${name}`);
  }
  useEffect(()=>{
    const { cluster } = props.location.state || '';
    if (cluster) {saveSelectedCluster(cluster)}
    fetchStorage();
  },[selectedCluster, props.location.state, userName, saveSelectedCluster])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.name === 'azureDataStorage') {
      setAzureDataStorage(event.target.value);
    }
    if (event.target.name === 'nfsDataStorage') {
      setNFSDataStorage(event.target.value);
    }
    if ((nfsDataStorage.length > 0 && azureDataStorage.length > 0) || event.target.value.length > 0) {
      setSubmittable(false)
    } else {
      setSubmittable(true)
    }

  }

  const convertURI = (type: string, folder: string) => {
    if (type === "adls") {
      if (folder.match(/^adl:\/\//)) {
        // adl://example.com/file
        return folder;
      } else if (folder.match(/^\/\//i)) {
        // //example.com/file
        return "adl:" + folder;
      } else if (folder.match(/^\//i)) {
        // /example.com/file
        return "adl:/" + folder;
      } else {
        // example.com/file
        return "adl://" + folder;
      }
    } else if (type === "nfs") {
      if (folder.match(/^\//)) {
        // /dir/file
        return folder;
      } else {
        // dir/file
        return "/" + folder;
      }
    }
    return folder;
  }
  const covert = (dataJob: any) => {
    dataJob.vcName = selectedTeam;
    dataJob.jobName = "Data Job @ " + new Date().toISOString();
    if (azureDataStorage) {
      dataJob.fromFolder = azureDataStorage;
    } else {
      dataJob.fromFolder = formats.azureDataStorage;
    }
    if (nfsDataStorage) {
      dataJob.toFolder = nfsDataStorage;
    } else {
      dataJob.toFolder = formats.nfsDataStorage
    }
    dataJob.userName = userName;
    dataJob.jobType = 'training';
    dataJob.jobtrainingtype = "RegularJob";
    dataJob.gpuType = gpuModel;
    dataJob.runningasroot = "1";
    dataJob.resourcegpu = 0;
    dataJob.containerUserId = 0;
    dataJob.image = "indexserveregistry.azurecr.io/dlts-data-transfer-image";
    dataJob.cmd = [
      "cd /DataUtils && ./copy_data.sh",
      convertURI("adls", dataJob.fromFolder),
      convertURI("nfs", dataJob.toFolder),
      "False 33554432 4 8 2>/dev/null"
    ].join(" ");
    return dataJob;
  }
  const[currentJobId, setCurrentJobId] = useState('');
  const postDataJob = () => {
    let dataJob: any = {};
    dataJob = covert(dataJob);
    fetch(`/api/clusters/${selectedCluster}/jobs`,{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body:JSON.stringify(dataJob)
    }).then(async (res: any) => {
      const data = await res.json();
      const { jobId } = data;
      if (jobId) {
        setDialogContentText(`${jobId} successfully submitted`);
        setCurrentJobId(jobId);
        setOpenDialog(true);
      }
    })
  }

  return (
    <Container maxWidth="md" className={styles.container}>
      <Card>
        <CardHeader title="Manage Data"/>
        <Divider/>
        <CardContent>
          <Grid
            container
            wrap="wrap"
            spacing={1}
          >
            <Grid item xs={12} sm={6}>
              <ClusterSelectField
                fullWidth
                cluster={selectedCluster}
                onClusterChange={saveSelectedCluster}
              />
            </Grid>
            <DirectoryPathTextField
              label="Work Directory"
              value={workStorage}
            />
            <DirectoryPathTextField
              label="Data Directory"
              value={dataStorage}
            />
            <TextField
              error={!azureDataStorage && !formats.azureDataStorage}
              name={"azureDataStorage"}
              onChange={handleChange}
              id="outlined-error"
              label="From Folder of Azure Data Lake Storage *"
              defaultValue={formats.azureDataStorage}
              placeholder={formats.azureDataStorage}
              fullWidth
              margin="dense"
            />
            <TextField
              error={!nfsDataStorage && !formats.nfsDataStorage}
              name={"nfsDataStorage"}
              onChange={handleChange}
              id="outlined-error"
              defaultValue={formats.nfsDataStorage}
              placeholder={formats.nfsDataStorage}
              label="To NFS Data Folder *"
              fullWidth
              margin="dense"
            />
          </Grid>
        </CardContent>
        <CardActions>
          <Button type="submit" disabled={submittable} color="primary" variant="contained" className={styles.submitButton} onClick={postDataJob}>Submit</Button>
        </CardActions>
      </Card>
      <Dialog
        open={openDialog}
        TransitionComponent={Transition}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Info"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" className={styles.dialogText}>
            { dialogContentText }
          </DialogContentText>
          <DialogActions>
            <Button component={Link}
              to={ `/job/${selectedTeam}/${selectedCluster}/${currentJobId}` }
              color="secondary"
            >
                  ok
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default DataJob;
