"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Coins, Trophy, Brain, Star, TrendingUp } from "lucide-react"
import { MotionWrapper } from "./motion-wrapper"

export function PlayToEarnSystem({ playerData, setPlayerData }: { playerData: any; setPlayerData: any }) {
  const [earnings, setEarnings] = useState({
    today: 150,
    week: 890,
    month: 3420,
  })

  const [staking, setStaking] = useState({
    stakedTokens: 500,
    dailyReward: 25,
    apy: 18.5,
  })

  useEffect(() => {
    // Simulate real-time earnings
    const interval = setInterval(() => {
      setPlayerData((prev: any) => ({
        ...prev,
        shadowTokens: prev.shadowTokens + Math.floor(Math.random() * 3),
      }))
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [setPlayerData])

  const claimDailyReward = () => {
    setPlayerData((prev: any) => ({
      ...prev,
      shadowTokens: prev.shadowTokens + staking.dailyReward,
    }))
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Current Balance */}
      <MotionWrapper
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <Badge variant="outline" className="border-yellow-500 text-yellow-400 px-3 py-1">
          <Coins className="w-4 h-4 mr-1" />
          {playerData.shadowTokens.toLocaleString()} SHADOW
          <TrendingUp className="w-3 h-3 ml-1 text-green-400" />
        </Badge>
      </MotionWrapper>

      {/* Level Badge */}
      <Badge variant="outline" className="border-purple-500 text-purple-400 px-3 py-1">
        <Trophy className="w-4 h-4 mr-1" />
        Level {playerData.level}
      </Badge>

      {/* Neural Power */}
      <Badge variant="outline" className="border-blue-500 text-blue-400 px-3 py-1">
        <Brain className="w-4 h-4 mr-1" />
        Neural: {Math.floor(playerData.experience / 10)}
      </Badge>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <Button size="sm" onClick={claimDailyReward} className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1">
          <Star className="w-3 h-3 mr-1" />
          Claim +{staking.dailyReward}
        </Button>
      </div>
    </div>
  )
}
