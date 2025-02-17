import React, { useEffect, useState, useCallback, FC, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import useFetch from "use-http";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import LinearProgress from "@material-ui/core/LinearProgress";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader, createMuiTheme,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem, MuiThemeProvider,
  TextField,
  Tooltip, Typography, withStyles
} from "@material-ui/core";
import {
  makeStyles,
  createStyles,
  useTheme,
  Theme,
  lighten
} from "@material-ui/core/styles";
import { MoreVert, FileCopyRounded} from "@material-ui/icons";
import {Cell, PieChart, Pie, ResponsiveContainer,Sector} from "recharts";
import UserContext from "../../contexts/User";
import TeamsContext from '../../contexts/Teams';
import {
  green,
  lightGreen,
  deepOrange,
  red,
  yellow
} from "@material-ui/core/colors";
import copy from 'clipboard-copy'
import {checkObjIsEmpty, sumValues} from "../../utlities/ObjUtlities";
import {DLTSSnackbar} from "../CommonComponents/DLTSSnackbar";
import _ from "lodash";
import {type} from "os";
import useCheckIsDesktop from "../../utlities/layoutUtlities";
import AuthzHOC from '../../components/AuthzHOC';
import './index.less';
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme: Theme) => createStyles({
  avatar: {
    backgroundColor: theme.palette.secondary.main,
  },
  cardHeaderContent: {
    width: 0
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  chart: {
    padding: 3,
    backgroundColor: theme.palette.background.default,
  },
  dialogText: {
    color:green[400]
  },
  success: {
    backgroundColor: green[600],
  },
  container: {
    margin: '0 auto',
  },
  tableTitle: {
    display: "flex",
    justifyContent: "center"
  },
  tableInfo: {
    justifyContent: "space-between",
    display: "flex"
  }
}));

const ActionIconButton: FC<{cluster?: string}> = ({cluster}) => {
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);
  const iconButton = useRef<any>();
  const onIconButtonClick = useCallback(() => setOpen(true), [setOpen]);
  const onMenuClose = useCallback(() => setOpen(false), [setOpen]);

  return (
    <>
      <IconButton ref={iconButton} onClick={onIconButtonClick}>
        <MoreVert/>
      </IconButton>
      <AuthzHOC needPermission={['VIEW_CLUSTER_STATUS', 'SUBMIT_TRAINING_JOB', 'VIEW_AND_MANAGE_ALL_USERS_JOB', 'MANAGE_ALL_USERS_JOB' ]}>
        <Menu
          anchorEl={iconButton.current}
          anchorOrigin={{ horizontal: "right", vertical: "top" }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          open={open}
          onClose={onMenuClose}
        >
          <AuthzHOC needPermission={'VIEW_CLUSTER_STATUS'}>
  <MenuItem component={Link} to={"/cluster-status"}>{t('home.clusterStatus')}</MenuItem>
          </AuthzHOC>
          <AuthzHOC needPermission={['SUBMIT_TRAINING_JOB', 'VIEW_AND_MANAGE_ALL_USERS_JOB', 'MANAGE_ALL_USERS_JOB']}>
  <MenuItem component={Link} to={`/jobs-v2/${cluster}`}>{t('home.viewJobs')}</MenuItem>
          </AuthzHOC>
          <AuthzHOC needPermission={'EDGE_INFERENCE'}>
            <MenuItem component={Link} to="/model">Edge Inference</MenuItem>
          </AuthzHOC>
        </Menu>
      </AuthzHOC>
    </>
  )
};

const Chart: FC<{
  available: number;
  used: number;
  reserved: number;
  isActive: boolean;

}> = ({ available, used, reserved ,isActive}) => {
  const {t} = useTranslation();
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  let data = [];
  if (available === 0 && used === 0 && reserved === 0) {
    data = [{ name: t('home.noResources'), value: 100, color: "#e0e0e0" }];
  } else {
    data = [
      { name: t('home.chartAvailable'), value: available, color: lightGreen[400] },
      { name: t('home.chartUsed'), value: used, color: theme.palette.grey[500] },
      { name: t('home.chartUnschedulable'), value: reserved, color: deepOrange[400]},
    ];
  }
  if (reserved === 0) {
    data = data.filter((item)=>item.name !== 'Reserved');
  }
  const styles = useStyles();
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 8;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{payload.name}</text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        {
          (!(available === 0 && used === 0 && reserved === 0)) && 
          <>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{value === 0 ? '' : `${value}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
              {percent === 0 ? '' : `(${(Math.round(percent * 100))}%)`}
            </text>
          </>
        }
      </g>
    );
  };
  const onPieEnter = (data: any, index: number) => {
    setActiveIndex(index);
  }

  return (
    <>
      <ResponsiveContainer aspect={8 / 8} width='100%' height='100%'>
        <PieChart>
          <Pie
            dataKey="value"
            isAnimationActive={isActive}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx={170}
            cy={165}
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            onMouseEnter={onPieEnter}
          >
            { data.map(({ name, color }) => <Cell key={name} fill={color}/>) }
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </>
  )
}

export const DirectoryPathTextField: FC<{
  label: string;
  value: string;
}> = ({ label, value }) => {
  const {t} = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [openCopyWarn, setOpenCopyWarn] = useState(false);
  const handleWarnClose = () => {
    setOpenCopyWarn(false);
  }
  const handleCopy = React.useCallback(() => {
    if (input.current) {
      copy(input.current.innerHTML).then(()=>{
        setOpenCopyWarn(true)
      })

    }
  },[input])
  return (
    <>
      <TextField
        inputRef={input}
        label={label}
        value={value}
        className="cardText"
        multiline
        rows={2}
        fullWidth
        variant="outlined"
        margin="dense"
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={(t('copy') as string)} placement="right">
                <IconButton>
                  <FileCopyRounded onClick={handleCopy} />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
      />
      <DLTSSnackbar message={t('home.successfullyCopied')} autoHideDuration={500} open={openCopyWarn} handleWarnClose={handleWarnClose} />
    </>
  );
}

const GPUCard: FC<{ cluster: string }> = ({ cluster }) => {
  const {t} = useTranslation();
  const styles = useStyles();
  const [activeJobs, setActiveJobs] = useState(0);
  const [available, setAvailable] = useState(0);
  const [used, setUsed] = useState(0);
  const [reversed, setReserved] = useState(0);
  const [workStorage, setWorkStorage ] = useState('');
  const [dataStorage, setDataStorage] = useState('');
  const [activate,setActivate] = useState(false);
  const { userName } = useContext(UserContext);
  const {selectedTeam} = useContext(TeamsContext);
  const fetchDiretoryUrl = `/api/clusters/${cluster}`;
  const request = useFetch(fetchDiretoryUrl);
  const fetchDirectories = async () => {
    const data = await request.get('');
    if (data) {
      const name = typeof userName === 'string' ?  userName.split('@', 1)[0] : userName;
      setDataStorage(data.dataStorage);
      setWorkStorage(`${data.workStorage}/${name}`);
      return data;
    }
  }
  const fetchClusterStatusUrl = `/api`;
  const requestClusterStatus = useFetch(fetchClusterStatusUrl);
  const fetchClusterStatus = async () => {
    setActivate(false);
    const data = await requestClusterStatus.get(`/teams/${selectedTeam}/clusters/${cluster}`);
    return data;
  }
  const [nfsStorage, setNfsStorage] = useState([]);

  useEffect(()=>{
    fetchDirectories().then((res) => {
      let fetchStorage = [];
      let availBytesSubPath = '/api/datasources/proxy/1/api/v1/query?query=node_filesystem_avail_bytes{fstype=~"nfs[0-9]?"}';
      let sizeBytesSubPath = '/api/datasources/proxy/1/api/v1/query?query=node_filesystem_size_bytes{fstype=~"nfs[0-9]?"}';
      if (res && res.grafana) {
        fetchStorage.push(fetch(`${res['grafana']}${availBytesSubPath}`));
        fetchStorage.push(fetch(`${res['grafana']}${sizeBytesSubPath}`));
      }
      let storageRes: any = [];
      let tmpStorage: any = [];
      Promise.all(fetchStorage).then((responses) => {
        responses.forEach(async (response: any) => {
          const res = await response.json();
          if (res['data']) {
            for (let item of res['data']["result"]) {
              let tmp = {} as any;
              if (item['metric']['__name__'] == "node_filesystem_size_bytes") {
                let mountpointName = item['metric']['mountpoint']
                let val = Math.floor(item['value'][1] / (Math.pow(1024, 3)))
                tmp['mountpointName'] = mountpointName;
                tmp['total'] = val;
              }
              let tmpAvail = {} as any;
              //node_filesystem_avail_bytes
              if (item['metric']['__name__'] == "node_filesystem_avail_bytes") {
                let mountpointName = item['metric']['mountpoint']
                let val = Math.floor(item['value'][1] / (Math.pow(1024, 3)))
                tmpAvail['mountpointName'] = mountpointName;
                tmpAvail['Avail'] = val;
              }
              tmpStorage.push(tmp)
              tmpStorage.push(tmpAvail)
            }
          }
          //({ mountpointName: key, users: value })
          storageRes = tmpStorage.filter((store: any) => !checkObjIsEmpty(store));
          let finalStorageRes: any = [];
          if (storageRes && storageRes.length > 0) {
            finalStorageRes = _.chain(storageRes).groupBy('mountpointName').map((value, key) => {
              let tmpTotal: any = value.filter((item: any) => item.hasOwnProperty('total'));
              let tmpAvail: any = value.filter((item: any) => item.hasOwnProperty('Avail'));
              let total = 0;
              let used = 0;
              if (typeof tmpTotal[0] !== "undefined" && typeof  tmpAvail[0] !== "undefined") {
                total = tmpTotal[0]["total"];
                used = tmpTotal[0]["total"] - tmpAvail[0]["Avail"]
              }
              return {
                mountpointName: key, total:total, used: used
              }
            }).value();
          }
          finalStorageRes.forEach((item: any,i: number) => {
            if(item["mountpointName"].indexOf("dlws/nfs") !== -1){
              finalStorageRes.splice(i, 1);
              finalStorageRes.unshift(item);
            }
          });
          finalStorageRes = finalStorageRes.filter((item: any) => {
            return !(item["mountpointName"].indexOf("dlts") === -1 && item["mountpointName"].indexOf("dlws/nfs") === -1 && item["mountpointName"].indexOf("dlws") === -1);
          })
          setNfsStorage(finalStorageRes.filter((store: any) => {
            if (selectedTeam === 'MMBellevue' && store['mountpointName'].indexOf('/mntdlws/nfs') !== -1) {
              return null;
            }
            return store['mountpointName'].indexOf(selectedTeam) !== -1 || store['mountpointName'].indexOf("dlws/nfs") !== -1||store['mountpointName'].indexOf("dlws") !== -1;
          }));
        });
      });
    });
    fetchClusterStatus().then((res) => {
      if (res) {
        const availableGpu = !checkObjIsEmpty(res['gpu_avaliable']) ? (Number)(sumValues(res['gpu_avaliable'])) : 0;
        setAvailable(availableGpu);
        const usedGpu = !checkObjIsEmpty(res['gpu_used']) ? (Number)(sumValues(res['gpu_used'])) : 0;
        setUsed(usedGpu);
        const reversedGpu = !checkObjIsEmpty(res['gpu_unschedulable']) ? (Number)(sumValues(res['gpu_unschedulable'])) : 0;
        setReserved(reversedGpu);
        setActiveJobs((Number)(sumValues(res['AvaliableJobNum'])));
        setActivate(true);
      }

    }).catch(err => {
      console.log('err', err)
    })
  },[selectedTeam]);
  const tableTheme = createMuiTheme({
    overrides: {
      MuiTableCell: {
        root: {
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft:2,
          paddingRight:5,
        }
      }
    }
  });
  const BorderLinearProgress = withStyles({
    root: {
      height: 10,
      backgroundColor: lighten('#363636', 0.5),
    },
    bar: {
      borderRadius: 20,
      backgroundColor: green[400],
    },
  })(LinearProgress);
  const GenernalLinerProgress = withStyles({
    root: {
      height: 10,
      backgroundColor: lighten('#363636', 0.5),
    },
    bar: {
      borderRadius: 20,
      backgroundColor: yellow[800],
    },
  })(LinearProgress);
  const FullBorderLinearProgress = withStyles({
    root: {
      height: 10,
      backgroundColor: lighten('#363636', 0.5),
    },
    bar: {
      borderRadius: 20,
      backgroundColor: red[400],
    },
  })(LinearProgress);
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        title={cluster}
        titleTypographyProps={{
          component: "h3",
          variant: "body2",
          noWrap: true
        }}
        subheader={` ${activeJobs} ${t('home.activeJobs')}`}
        action={<ActionIconButton cluster={cluster}/>}
        classes={{ content: styles.cardHeaderContent }}
      />
      <CardContent className={styles.chart}>
        <Chart available={available} used={used} reserved={reversed} isActive={activate} />
        <Divider />
        <Typography  variant="h6" id="tableTitle" className={styles.tableTitle}>
          {t('home.storage')+" (GB)"}
        </Typography>
        <Box height={102} style={{ overflow: 'auto' }}>
          <MuiThemeProvider theme={tableTheme}>
            <Table>
              <TableBody>
                {nfsStorage.map((nfs: any, index: number) => {
                  let nfsMountNames = nfs['mountpointName'].split("/");
                  let mounName = "";
                  if (nfs['mountpointName'].indexOf("dlws") !== -1) {
                    mounName = "/data";
                  } else {
                    nfsMountNames.splice(0, nfsMountNames.length - 1);
                    mounName = "/" + nfsMountNames.join('/');
                  }
                  let value = nfs['total'] == 0 ? 0 : (nfs['used'] / nfs['total']) * 100;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {value < 80 ? <BorderLinearProgress value={value} variant={"determinate"}/> : value >= 80 && value < 90 ? <GenernalLinerProgress value={value} variant={"determinate"}/> : <FullBorderLinearProgress value={value} variant={"determinate"}/>}
                        <div className={styles.tableInfo}><span>{`${mounName}`}</span><span>{`(${t('home.used')}: ${nfs['used']}, ${t('home.total')}: ${nfs['total']}) ${Math.floor(value)}% ${t('home.used')}`}</span></div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </MuiThemeProvider>
        </Box>
      </CardContent>
      <AuthzHOC needPermission={'SUBMIT_TRAINING_JOB'}>
        <CardActions>
          <Button component={Link}
            to={{pathname: "/submission/training-cluster", state: { cluster } }}
            size="small" color="secondary"
          >
            {t('home.submitTrainingJob')}
          </Button>
          {/* <Button component={Link}
            to={{pathname: "/submission/data", state: { cluster } }}
            size="small" color="secondary"
          >
            Submit Data Job
          </Button> */}
          <Divider/>
        </CardActions>
      </AuthzHOC>
      <CardContent>
        <DirectoryPathTextField
          label={t('home.workDirectory')}
          value={workStorage}
        />
        <DirectoryPathTextField
          label={t('home.dataDirectory')}
          value={dataStorage}
        />
      </CardContent>
    </Card>
  );
};

export default GPUCard;
