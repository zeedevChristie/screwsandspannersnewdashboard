import React from 'react'
import Dashboard from '../dashboard'
import OverviewStatistics from './overviewComponents/overviewStatistics'
import OverviewGraph from './overviewGraph'
import AnalyticsSection from './overviewComponents/analyticsSection'
import OverviewTopSections from './overviewTopSections'
import RevenueAndAgentSection from './revenueAndAgentSection'
import ActivityOverview from './activityOverview'

const Overview = () => {
  return (
    <div className='space-y-4'>
      <Dashboard/>
      <OverviewStatistics/>
      <OverviewGraph/>
      <AnalyticsSection/> 
      <OverviewTopSections/>
      <RevenueAndAgentSection/>
      <ActivityOverview/>
    </div>
  )
}

export default Overview
