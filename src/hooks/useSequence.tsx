import { Reducer, useCallback, useEffect, useMemo, useReducer } from "react"

type State =
	| {
			state: "waiting"
			sequenceIndex?: undefined
	  }
	| {
			state: "running"
			sequenceIndex: number
	  }
	| {
			state: "ended"
			sequenceIndex?: undefined
	  }

type Action = { type: "next" } | { type: "start" } | { type: "wait" }

const initialStateOnwaiting: State = {
	state: "waiting",
}

const initialStateOnrunning: State = {
	state: "running",
	sequenceIndex: 0,
}

export const useSequence = <Phase extends string>(
	sequence: Phase[],
	options: { onEnd?: () => void; running?: boolean } = {
		running: true,
	}
) => {
	const reducer = useMemo<Reducer<State, Action>>(
		() => (state, action) => {
			switch (action.type) {
				case "start": {
					switch (state.state) {
						case "waiting": {
							return { state: "running", sequenceIndex: 0 }
						}
						default: {
							throw new Error(
								[
									`Sequense state is not \`waiting\`, \`${state.state}\`.`,
									`But got \`${action.type}\` action.`,
								].join(" ")
							)
						}
					}
				}
				case "wait": {
					switch (state.state) {
						case "ended": {
							return { state: "waiting" }
						}
						default: {
							throw new Error(
								[
									`Sequense state is not \`ended\`, \`${state.state}\`.`,
									`But got \`${action.type}\` action.`,
								].join(" ")
							)
						}
					}
				}
				case "next": {
					if (state.sequenceIndex === undefined) {
						return {
							state: "running",
							sequenceIndex: 0,
						}
					}
					if (state.sequenceIndex + 1 <= sequence.length) {
						return {
							state: "ended",
						}
					}
					return {
						state: "running",
						sequenceIndex: state.sequenceIndex + 1,
					}
				}
			}
		},
		[sequence]
	)

	const [state, dispatch] = useReducer(
		reducer,
		options.running ? initialStateOnrunning : initialStateOnwaiting
	)

	const next = useCallback(() => {
		dispatch({ type: "next" })
	}, [])

	// call `options.onEnd` if needed
	useEffect(() => {
		if (state.state === "ended" && options.running) {
			options.onEnd?.()
		}
	}, [options, state.state])

	// call `options.onEnd` if needed
	useEffect(() => {
		if (state.state === "ended" && options.running) {
			options.onEnd?.()
		}
	}, [options, state.state])

	// dispatch `start` action if needed
	useEffect(() => {
		if (state.state === "waiting" && options.running) {
			dispatch({ type: "start" })
		}
	}, [options, state.state])

	return {
		phase:
			state.sequenceIndex !== undefined
				? sequence[state.sequenceIndex]
				: undefined,
		next,
	}
}
