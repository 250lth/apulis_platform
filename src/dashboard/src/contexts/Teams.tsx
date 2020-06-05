import React, { useContext, useEffect, useState, SetStateAction, createContext, FC } from 'react';
import {
  Box, Button,
  Dialog, DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@material-ui/core";
import _ from "lodash";
import ConfigContext from './Config';
import ClustersContext from '../contexts/Clusters';
import axios from 'axios';

interface Context {
  teams: any;
  selectedTeam: any;
  saveSelectedTeam(team: SetStateAction<string>): void;
  clusterId: string;
  saveClusterId(clusterId: SetStateAction<string>): void;
  getTeams(): void;
}

const Context = createContext<Context>({
  teams: [],
  selectedTeam: '',
  saveSelectedTeam: function(team: SetStateAction<string>) {},
  clusterId: '',
  saveClusterId: function(clusterId: SetStateAction<string>) {},
  getTeams: function() {},
});

export default Context;
export const Provider: FC = ({ children }) => {
  const { addGroup } = useContext(ConfigContext);
  const [clusterId, setClusterId] = useState<string>('');
  const saveClusterId = (clusterId: SetStateAction<string>) => {
    setClusterId(clusterId);
  };
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const saveSelectedTeam = (team: SetStateAction<string>) => {
    setSelectedTeam(team);
    localStorage.setItem('team',team.toString());
    if (clusterId && window.location.pathname.split(`${clusterId}/`)[1]) {
      window.location.href = `/jobs-v2/${clusterId}/`;
    } else {
      window.location.reload();
    }
  }

  const getTeams = () => {
    axios.get('/teams').then(res => {
      setTeams(res.data);
    })
  }

  useEffect(() => {
    getTeams();
  }, [])

  useEffect(()=> {
    if (localStorage.getItem('team')) {
      setSelectedTeam((String)(localStorage.getItem('team')))
    } else {
      setSelectedTeam(_.map(teams, 'id')[0]);
    }
  },[teams]);
  
  const EmptyTeam: FC = () => {
    const onClick = () => {
      window.open(addGroup, "_blank");
    }
    return (
      <Box display="flex">
        <Dialog open>
          <DialogTitle style={{ color: 'red' }}>
            {"warning"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {"You are not an authorized user for this cluster. Please request to join a security group by following the button below."}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClick} color="primary">
              JOIN SG
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  };
  // if (teams !== undefined && teams.length === 0) {
  //   return (

  //     <Context.Provider
  //       value={{ teams, selectedTeam ,saveSelectedTeam,WikiLink }}
  //       children={<EmptyTeam addGroupLink={addGroupLink} WikiLink={WikiLink}/>}
  //     />
  //   )
  // }
  return (
    <Context.Provider
      value={{ teams, selectedTeam, saveSelectedTeam, clusterId, saveClusterId, getTeams }}
      children={children}
    />
  );
};
