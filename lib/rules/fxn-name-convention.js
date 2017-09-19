const _ = require("lodash")
	,nlp = require("compromise")

var matchesPOS=_.memoize(function(fxnName,options={}){
	var phrase=_.lowerCase(fxnName).trim()
		,words=phrase.split(' ')
		,firstWord=words[0]
		,allowedPatterns=options.allow||[]
		,disallowedPatterns=options.disallow||[]
		,isRegexy= x=>{
			if(_.isRegExp(x)) return x
			//string-look
			else if(x[0]=='/' && x.match(/\/[gimuy]*$/)){
				var [all,pattern,flags]=x.match(/^\/(.*)\/([gimuy]*)$/)
				return new RegExp(pattern,flags||"")
			}
			else return false
		} 
		,assumptions=options.assume||new Map()//_.reduce(options.assume,(o,pos,word)=> o.set(isRegexy(word)||word,pos), new Map())
		,testPatterns= (patterns)=>{
			var o=nlp(phrase)
			
			assumptions.forEach((assumedSpeechPart,ptrn)=>{
				_.each(phrase.match(ptrn),(assumedWord)=>{
					o.match(assumedWord).tag(assumedSpeechPart)
				})
			})
			
			return patterns.reduce((isValid,pattern)=>{
				if(isValid) return isValid // if already truthy, leave early
				var maybeRegex=isRegexy(pattern)
				return maybeRegex
					? !!phrase.match(maybeRegex) //if pattern is regex, match 
					: !!o.match(pattern).out() //else use compromise syntax
			},false)
		}
		,allowed=testPatterns(allowedPatterns)
		,disallowed=testPatterns(disallowedPatterns)
		,valid=allowed && !disallowed
		
	return {valid,phrase}
},(...args)=>args.join('~'))
	,successes=0
	,fails=0

module.exports = {
	meta: {
		docs: {
			description: "require function names match certain speech patterns or regex",
			category: "Stylistic Issues",
			recommended: false
		},
		fixable: null,  // or "code" or "whitespace"
		schema: [
			{
				type:"object"
			}
		]
	},

	create(context) {
		function checkName(name,node){
			var {valid,phrase}=matchesPOS(name,context.options[0])
				//can it be more specific?  Would need finer grain on how it fails...
				,message=`${name}()${name!=phrase?` -> "${phrase}"`:''} does${valid?' ':' not '}match naming patterns` 

			if(!valid){
				fails++
				context.report({
					node
					,message 
					,data: {name}
				})
			}
			else{
				successes++
			}
		}
		
		return {
			"Program:exit"(){
				console.log(`${successes} / ${successes+fails} or ${((successes/(successes+fails))*100).toFixed(0)}% of fxn named correctly`)
			},
			"Identifier:exit"(node){
				var parent=node.parent
				
				if(parent.type=='FunctionDeclaration' && !( parent.params && parent.params.filter(p=>p.name==node.name).length)//but I am not a param
				|| parent.type=='MethodDefinition' 
				|| parent.type=='FunctionExpression' && parent.parent.type=='AssignmentPattern'
				|| parent.type=='AssignmentPattern' && parent.right && parent.right.type.match(FREGEX)//fxn23
				|| (parent.type=='Property' && 
					( parent.value.type.match(FREGEX)
					||parent.value.type=='SequenceExpression' && parent.value.expressions[parent.value.expressions.length-1].type.match(FREGEX)
					)
				)
				|| parent.type=='VariableDeclarator' && parent.init && parent.init.type.match(FREGEX)
				|| parent.type=='AssignmentExpression' && parent.right.type.match(FREGEX)
				){
					checkName(node.name,node)
				}
				
			},
			"FunctionExpression:exit"(node){
				var parent=node.parent
				if(parent.key && parent.key.type=='Literal'){
					checkName(parent.key.value,node)
				}
				else if(parent.type=='AssignmentExpression'
					&& parent.left.type=='MemberExpression'
					&& ['Identifier','Literal'].includes(parent.left.property.type)
				){
					var name=parent.left.property.name || parent.left.property.value
					checkName(name,node)
				}
				else if(parent.type=='MethodDefinition' && parent.key.type=='Identifier' && parent.key.name=='constructor'){
					//console.log("found D constructor (ignore)")
					//checkName(name,node)
				}
				else if(0){}
				
				//console.log("found X "+astUtils.getFunctionNameWithKind(node))//does not appear to catch all desired cases
			}
		}
	}
};