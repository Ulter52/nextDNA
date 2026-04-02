import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProjectsStackParamList } from '../types';
import { ProjectList } from '../../modules/projects/screens/projectList';
import { ProjectDetail } from '../../modules/projects/screens/projectDetail';
import { ProjectEdit } from '../../modules/projects/screens/projectEdit';

const Stack = createNativeStackNavigator<ProjectsStackParamList>();

export function ProjectsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProjectList" component={ProjectList} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetail} />
      <Stack.Screen name="ProjectEdit" component={ProjectEdit} />
    </Stack.Navigator>
  );
}
