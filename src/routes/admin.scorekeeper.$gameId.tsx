/**
 * Scorekeeper Interface
 * 
 * Mobile-optimized interface for recording game events in real-time.
 * Features optimistic UI updates with automatic rollback on errors.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { useState } from 'react'
import { LiveScoreboard } from '../../components/LiveScoreboard'

export const Route = createFileRoute('/admin/scorekeeper/$gameId')({
  component: ScorekeeperPage,
})

function ScorekeeperPage() {
  const { gameId } = Route.useParams()
  const queryClient = useQueryClient()
  const [showPlayerSelect, setShowPlayerSelect] = useState(false)
  const [pendingGoal, setPendingGoal] = useState<{ team: 'home' | 'away' } | null>(null)
  
  // Fetch game data with real-time updates
  const { data: game, isPending: isGamePending } = useQuery(
    convexQuery(api.games.getGame, { 
      gameId: gameId as Id<"games"> 
    })
  )
  
  const { data: gameState } = useQuery(
    convexQuery(api.games.getGameState, { 
      gameId: gameId as Id<"games"> 
    })
  )
  
  // Get team players for assist selection
  const { data: homePlayers = [] } = useQuery(
    convexQuery(api.games.getTeamPlayers, {
      teamId: game?.homeTeamId as Id<"teams">,
      activeOnly: true,
    }),
    { enabled: !!game?.homeTeamId }
  )
  
  const { data: awayPlayers = [] } = useQuery(
    convexQuery(api.games.getTeamPlayers, {
      teamId: game?.awayTeamId as Id<"teams">,
      activeOnly: true,
    }),
    { enabled: !!game?.awayTeamId }
  )
  
  // Mutations with optimistic updates
  const recordGoalMutation = useConvexMutation(api.gameMutations.recordGoal)
  const updatePossessionMutation = useConvexMutation(api.gameMutations.updatePossession)
  const recordTurnoverMutation = useConvexMutation(api.gameMutations.recordTurnover)
  const updateClockMutation = useConvexMutation(api.gameMutations.updateClock)
  
  // Handle goal with optimistic update
  const handleGoal = async (team: 'home' | 'away', scoredBy?: Id<"players">) => {
    if (!gameState) return
    
    const mutation = useMutation({
      mutationFn: async () => {
        return await recordGoalMutation({
          gameId: gameId as Id<"games">,
          scoringTeam: team,
          scoredBy,
        })
      },
      
      // Optimistic update - immediately update UI
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ 
          queryKey: ['convex', 'games.getGameState', { gameId }] 
        })
        
        // Snapshot previous value
        const previousState = queryClient.getQueryData([
          'convex', 
          'games.getGameState', 
          { gameId }
        ])
        
        // Optimistically update to new value
        queryClient.setQueryData(
          ['convex', 'games.getGameState', { gameId }],
          (old: any) => {
            if (!old) return old
            return {
              ...old,
              [team === 'home' ? 'homeScore' : 'awayScore']: 
                old[team === 'home' ? 'homeScore' : 'awayScore'] + 1,
              possession: team === 'home' ? 'away' : 'home', // Switch possession
            }
          }
        )
        
        return { previousState }
      },
      
      // Rollback on error
      onError: (err, variables, context) => {
        if (context?.previousState) {
          queryClient.setQueryData(
            ['convex', 'games.getGameState', { gameId }],
            context.previousState
          )
        }
        alert(`Failed to record goal: ${err.message}`)
      },
      
      // Always refetch after success or error
      onSettled: () => {
        queryClient.invalidateQueries({ 
          queryKey: ['convex', 'games.getGameState', { gameId }] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['convex', 'games.getGameEvents', { gameId }] 
        })
      },
    })
    
    await mutation.mutateAsync()
    setShowPlayerSelect(false)
    setPendingGoal(null)
  }
  
  // Handle possession change
  const handlePossession = async (newPossession: 'home' | 'away') => {
    const mutation = useMutation({
      mutationFn: async () => {
        return await updatePossessionMutation({
          gameId: gameId as Id<"games">,
          possession: newPossession,
        })
      },
      
      onMutate: async () => {
        await queryClient.cancelQueries({ 
          queryKey: ['convex', 'games.getGameState', { gameId }] 
        })
        
        const previousState = queryClient.getQueryData([
          'convex', 
          'games.getGameState', 
          { gameId }
        ])
        
        queryClient.setQueryData(
          ['convex', 'games.getGameState', { gameId }],
          (old: any) => old ? { ...old, possession: newPossession } : old
        )
        
        return { previousState }
      },
      
      onError: (err, variables, context) => {
        if (context?.previousState) {
          queryClient.setQueryData(
            ['convex', 'games.getGameState', { gameId }],
            context.previousState
          )
        }
        alert(`Failed to update possession: ${err.message}`)
      },
      
      onSettled: () => {
        queryClient.invalidateQueries({ 
          queryKey: ['convex', 'games.getGameState', { gameId }] 
        })
      },
    })
    
    await mutation.mutateAsync()
  }
  
  // Handle turnover
  const handleTurnover = async (turnoverType: string) => {
    const mutation = useMutation({
      mutationFn: async () => {
        return await recordTurnoverMutation({
          gameId: gameId as Id<"games">,
          turnoverType,
        })
      },
      
      onMutate: async () => {
        await queryClient.cancelQueries({ 
          queryKey: ['convex', 'games.getGameState', { gameId }] 
        })
        
        const previousState = queryClient.getQueryData([
          'convex', 
          'games.getGameState', 
          { gameId }
        ])
        
        // Switch possession on turnover
        queryClient.setQueryData(
          ['convex', 'games.getGameState', { gameId }],
          (old: any) => {
            if (!old) return old
            return {
              ...old,
              possession: old.possession === 'home' ? 'away' : 'home',
            }
          }
        )
        
        return { previousState }
      },
      
      onError: (err, variables, context) => {
        if (context?.previousState) {
          queryClient.setQueryData(
            ['convex', 'games.getGameState', { gameId }],
            context.previousState
          )
        }
        alert(`Failed to record turnover: ${err.message}`)
      },
      
      onSettled: () => {
        queryClient.invalidateQueries({ 
          queryKey: ['convex', 'games.getGameState', { gameId }] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['convex', 'games.getGameEvents', { gameId }] 
        })
      },
    })
    
    await mutation.mutateAsync()
  }
  
  if (isGamePending || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading game...</div>
      </div>
    )
  }
  
  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Game not started</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => alert('Start game functionality coming soon!')}
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold text-gray-900">
            Scorekeeper
          </h1>
          <p className="text-sm text-gray-600">
            {game.homeTeam?.name} vs {game.awayTeam?.name}
          </p>
        </div>
      </header>
      
      {/* Live Scoreboard */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <LiveScoreboard 
          game={game} 
          gameState={gameState}
        />
      </div>
      
      {/* Scoring Controls - Mobile Optimized */}
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {/* Goal Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Record Goal</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setPendingGoal({ team: 'home' })
                setShowPlayerSelect(true)
              }}
              className="py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl rounded-lg transition-colors active:scale-95"
            >
              {game.homeTeam?.abbreviation || 'HOME'} Goal
            </button>
            <button
              onClick={() => {
                setPendingGoal({ team: 'away' })
                setShowPlayerSelect(true)
              }}
              className="py-6 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition-colors active:scale-95"
            >
              {game.awayTeam?.abbreviation || 'AWAY'} Goal
            </button>
          </div>
        </div>
        
        {/* Possession Control */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Possession</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePossession('home')}
              className={`py-4 font-semibold rounded-lg transition-colors ${
                gameState.possession === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {game.homeTeam?.abbreviation || 'HOME'}
            </button>
            <button
              onClick={() => handlePossession('away')}
              className={`py-4 font-semibold rounded-lg transition-colors ${
                gameState.possession === 'away'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {game.awayTeam?.abbreviation || 'AWAY'}
            </button>
          </div>
        </div>
        
        {/* Turnover Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Turnovers</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleTurnover('drop')}
              className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium rounded-lg transition-colors text-sm"
            >
              Drop
            </button>
            <button
              onClick={() => handleTurnover('throwaway')}
              className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium rounded-lg transition-colors text-sm"
            >
              Throwaway
            </button>
            <button
              onClick={() => handleTurnover('block')}
              className="py-3 bg-green-100 hover:bg-green-200 text-green-800 font-medium rounded-lg transition-colors text-sm"
            >
              Block
            </button>
            <button
              onClick={() => handleTurnover('stall')}
              className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium rounded-lg transition-colors text-sm"
            >
              Stall
            </button>
            <button
              onClick={() => handleTurnover('out-of-bounds')}
              className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium rounded-lg transition-colors text-sm"
            >
              Out
            </button>
            <button
              onClick={() => handleTurnover('other')}
              className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Other
            </button>
          </div>
        </div>
      </div>
      
      {/* Player Selection Modal */}
      {showPlayerSelect && pendingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Who scored?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {pendingGoal.team === 'home' ? game.homeTeam?.name : game.awayTeam?.name}
              </p>
            </div>
            
            <div className="p-4 space-y-2">
              {/* Quick record without player */}
              <button
                onClick={() => handleGoal(pendingGoal.team)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Record Goal (No Player)
              </button>
              
              <div className="border-t border-gray-200 my-4"></div>
              
              {/* Player list */}
              {(pendingGoal.team === 'home' ? homePlayers : awayPlayers).map((player) => (
                <button
                  key={player._id}
                  onClick={() => handleGoal(pendingGoal.team!, player._id)}
                  className="w-full py-3 px-4 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">
                    #{player.jerseyNumber} {player.firstName} {player.lastName}
                  </div>
                  {player.position && (
                    <div className="text-sm text-gray-600 capitalize">
                      {player.position}
                    </div>
                  )}
                </button>
              ))}
              
              {(pendingGoal.team === 'home' ? homePlayers : awayPlayers).length === 0 && (
                <div className="text-center py-4 text-gray-600">
                  No players available
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowPlayerSelect(false)
                  setPendingGoal(null)
                }}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

