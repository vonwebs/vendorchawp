import React from 'react';
import { Tabs } from 'expo-router';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import BannedScreen from '@/components/BannedScreen';

interface ConditionalTabsProps {
    isMaintenance: boolean;
    isBanned: boolean;
}

export default function ConditionalTabs({ isMaintenance, isBanned }: ConditionalTabsProps) {
    if (isBanned) {
        return <BannedScreen />;
    }

    if (isMaintenance) {
        return <MaintenanceScreen />;
    }

    // Return null to render the actual tabs layout
    return null;
}
