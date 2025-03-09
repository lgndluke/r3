import MyForm           from '../form.js';
import MyTabs           from '../tabs.js';
import MyInputSelect    from '../inputSelect.js';
import {getLoginIcon}   from '../shared/admin.js';
import {dialogCloseAsk} from '../shared/dialog.js';
import srcBase64Icon    from '../shared/image.js';
import {getCaption}     from '../shared/language.js';
export {MyAdminLogin as default};

let MyAdminLoginRole = {
	name:'my-admin-login-role',
	template:`<td class="minimum role-content">
		<div class="row wrap gap">
			<my-button
				v-for="r in module.roles.filter(v => v.assignable && v.content === content)"
				@trigger="$emit('toggle',r.id)"
				:active="!readonly"
				:caption="getCaption('roleTitle',module.id,r.id,r.captions,r.name)"
				:captionTitle="getCaption('roleDesc',module.id,r.id,r.captions)"
				:image="roleIds.includes(r.id) ? 'checkbox1.png' : 'checkbox0.png'"
				:naked="true"
			/>
		</div>
	</td>`,
	props:{
		content: { type:String,  required:true }, // role content to filter by
		module:  { type:Object,  required:true }, // current module
		readonly:{ type:Boolean, required:true },
		roleIds: { type:Array,   required:true }  // already enabled roles by ID
	},
	emits:['toggle'],
	methods:{
		getCaption
	}
};

let MyAdminLogin = {
	name:'my-admin-login',
	components:{
		MyAdminLoginRole,
		MyForm,
		MyInputSelect,
		MyTabs
	},
	template:`<div class="app-sub-window under-header at-top with-margin" @mousedown.self="closeAsk">
		
		<!-- login record form -->
		<div class="app-sub-window under-header"
			v-if="isFormOpen"
			@mousedown.self="$refs.popUpForm.closeAsk()"
		>
			<my-form ref="popUpForm"
				@close="loginFormIndexOpen = null"
				@record-updated="updateLoginRecord(loginFormIndexOpen,$event);loginFormIndexOpen = null"
				:allowDel="false"
				:allowNew="false"
				:formId="loginForms[loginFormIndexOpen].formId"
				:isPopUp="true"
				:isPopUpFloating="true"
				:moduleId="formIdMap[loginForms[loginFormIndexOpen].formId].moduleId"
				:recordIds="loginFormRecords"
			/>
		</div>
		
		<div class="contentBox admin-login float" v-if="inputsReady">
			<div class="top">
				<div class="area nowrap">
					<img class="icon" :src="getLoginIcon(active,admin,isLimited,noAuth)" />
					<h1 class="title" v-if="!isNew && isLimited">{{ capApp.titleLimited.replace('{NAME}',name) }}</h1>
					<h1 class="title" v-else>{{ isNew ? capApp.titleNew : capApp.title.replace('{NAME}',name) }}</h1>
				</div>
				<div class="area">
					<my-button image="cancel.png"
						@trigger="closeAsk"
						:cancel="true"
					/>
				</div>
			</div>
			<div class="top lower">
				<div class="area">
					<my-button image="save.png"
						@trigger="set"
						:active="canSave"
						:caption="isNew ? capGen.button.create : capGen.button.save"
					/>
					<my-button image="refresh.png"
						v-if="!isNew"
						@trigger="get"
						:active="hasChanges"
						:caption="capGen.button.refresh"
					/>
					<my-button image="add.png"
						v-if="!isNew"
						@trigger="reset"
						:active="!isLdap"
						:caption="capGen.button.new"
					/>
				</div>
				<div class="area">
					<my-button image="warning.png"
						v-if="!isNew"
						@trigger="resetTotpAsk"
						:active="!noAuth"
						:cancel="true"
						:caption="capApp.button.resetMfa"
					/>
					<my-button image="delete.png"
						v-if="!isNew"
						@trigger="delAsk"
						:cancel="true"
						:caption="capGen.button.delete"
					/>
				</div>
			</div>
			
			<div class="content no-padding">
				<table class="generic-table-vertical w1200">
					<tbody>
						<tr>
							<td>
								<div class="title-cell">
									<img src="images/person.png" />
									<span>{{ capGen.name }}</span>
								</div>
							</td>
							<td class="default-inputs">
								<div class="column gap">
									<input v-model="name" v-focus @keyup="typedUniqueField('name',name)" :disabled="isLdap" />
									<div v-if="notUniqueName && name !== ''" class="message error">
										{{ capApp.dialog.notUniqueName }}
									</div>
								</div>
							</td>
							<td>{{ capApp.hint.name }}</td>
						</tr>
						<tr v-if="isNew">
							<td>
								<div class="title-cell">
									<img src="images/personTemplate.png" />
									<span>{{ capApp.template }}</span>
								</div>
							</td>
							<td class="default-inputs">
								<select v-model="templateId">
									<option v-for="t in templates" :title="t.comment" :value="t.id">
										{{ t.name }}
									</option>
								</select>
							</td>
							<td>{{ capApp.hint.template }}</td>
						</tr>
						<tr v-if="isLdap">
							<td>
								<div class="title-cell">
									<img src="images/hierarchy.png" />
									<span>{{ capApp.ldap }}</span>
								</div>
							</td>
							<td class="default-inputs">
								<select v-model="ldapId" disabled="disabled">
									<option :value="l.id" v-for="l in ldaps">{{ l.name }}</option>
								</select>
							</td>
							<td></td>
						</tr>
					</tbody>
				</table>

				<div class="login-details">
					<my-tabs class="login-details-tabs"
						v-model="tabTarget"
						:entries="['meta','roles','properties']"
						:entriesIcon="['images/editBox.png','images/personMultiple.png','images/personCog.png']"
						:entriesText="[capGen.details,capApp.roles.replace('{COUNT}',roleTotalNonHidden),capGen.properties]"
					/>
					<div class="login-details-content" :class="{ roles:tabTarget === 'roles' }">

						<!-- meta data -->
						<table class="generic-table-vertical default-inputs noRowBorders admin-login-meta" v-if="tabTarget === 'meta'">
							<tbody>
								<tr v-if="isLdap">
									<td colspan="2" class="grouping"><b>{{ capApp.ldapMeta }}</b></td>
								</tr>
								<tr>
									<td class="minimum">
										<div class="title-cell">
											<img src="images/edit.png" />
											<span>{{ capGen.name }}</span>
										</div>
									</td>
									<td>
										<table class="fullWidth">
											<tbody>
												<tr>
													<td class="minimum">{{ capApp.meta.nameFore }}</td>
													<td><input class="dynamic" v-model="meta.nameFore" :disabled="isLdap" /></td>
												</tr>
												<tr>
													<td class="minimum">{{ capApp.meta.nameSur }}</td>
													<td><input class="dynamic" v-model="meta.nameSur" :disabled="isLdap" /></td>
												</tr>
												<tr>
													<td class="minimum">{{ capApp.meta.nameDisplay }}</td>
													<td><input class="dynamic" v-model="meta.nameDisplay" :disabled="isLdap" /></td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
								<tr>
									<td class="minimum">
										<div class="title-cell">
											<img src="images/building1.png" />
											<span>{{ capApp.meta.organization }}</span>
										</div>
									</td>
									<td><input class="dynamic" v-model="meta.organization" :disabled="isLdap" /></td>
								</tr>
								<tr>
									<td class="minimum">
										<div class="title-cell">
											<img src="images/building2.png" />
											<span>{{ capApp.meta.location }}</span>
										</div>
									</td>
									<td><input class="dynamic" v-model="meta.location" :disabled="isLdap" /></td>
								</tr>
								<tr>
									<td class="minimum">
										<div class="title-cell">
											<img src="images/department.png" />
											<span>{{ capApp.meta.department }}</span>
										</div>
									</td>
									<td><input class="dynamic" v-model="meta.department" :disabled="isLdap" /></td>
								</tr>
								<tr>
									<td class="minimum">
										<div class="title-cell">
											<img src="images/mail2.png" />
											<span>{{ capApp.meta.email }}</span>
										</div>
									</td>
									<td>
										<div class="column gap">
											<input class="dynamic" v-model="meta.email" @keyup="typedUniqueField('email',meta.email)" :disabled="isLdap" />
											<div v-if="notUniqueEmail && meta.email !== ''" class="message error">
												{{ capApp.dialog.notUniqueEmail }}
											</div>
										</div>
									</td>
								</tr>
								<tr>
									<td class="minimum">
										<div class="title-cell">
											<img src="images/phone.png" />
											<span>{{ capApp.meta.phone }}</span>
										</div>
									</td>
									<td>
										<table class="fullWidth">
											<tbody>
												<tr>
													<td class="minimum">{{ capApp.meta.phoneMobile }}</td>
													<td><input class="dynamic" v-model="meta.phoneMobile" :disabled="isLdap" /></td>
												</tr>
												<tr>
													<td class="minimum">{{ capApp.meta.phoneLandline }}</td>
													<td><input class="dynamic" v-model="meta.phoneLandline" :disabled="isLdap" /></td>
												</tr>
												<tr>
													<td class="minimum">{{ capApp.meta.phoneFax }}</td>
													<td><input class="dynamic" v-model="meta.phoneFax" :disabled="isLdap" /></td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
								<tr>
									<td class="minimum">
										<div class="title-cell">
											<img src="images/text_lines.png" />
											<span>{{ capApp.meta.notes }}</span>
										</div>
									</td>
									<td><textarea class="dynamic" v-model="meta.notes" :disabled="isLdap"></textarea></td>
								</tr>
							</tbody>
						</table>
						
						<!-- roles -->
						<table class="generic-table sticky-top bright" v-if="tabTarget === 'roles'">
							<thead>
								<tr>
									<th v-if="isLdapAssignedRoles" colspan="4"><b>{{ capApp.ldapAssignActive }}</b></th>
								</tr>
								<tr>
									<th class="minimum">
										<div class="row centered gap space-between default-inputs">
											<span>{{ capGen.application }}</span>
											<input class="short" placeholder="..." v-model="roleFilter" :title="capGen.button.filter" />
										</div>
									</th>
									<th><my-button image="ok.png" @trigger="toggleRolesByContent('admin')" :active="!isLdapAssignedRoles" :caption="capApp.roleContentAdmin" :naked="true" /></th>
									<th><my-button image="ok.png" @trigger="toggleRolesByContent('user')"  :active="!isLdapAssignedRoles" :caption="capApp.roleContentUser"  :naked="true" /></th>
									<th><my-button image="ok.png" @trigger="toggleRolesByContent('other')" :active="!isLdapAssignedRoles" :caption="capApp.roleContentOther" :naked="true" /></th>
								</tr>
							</thead>
							<tbody>
								<tr
									v-for="m in modulesFiltered"
									:class="{ grouping:m.parentId === null }"
									:key="m.id"
								>
									<td class="minimum">
										<div class="row centered">
											<my-button image="dash.png"
												v-if="m.parentId !== null"
												:active="false"
												:naked="true"
											/>
											<img class="module-icon" :src="srcBase64Icon(m.iconId,'images/module.png')" />
											<span>{{ getCaption('moduleTitle',m.id,m.id,m.captions,m.name) }}</span>
										</div>
									</td>
									
									<!-- roles to toggle -->
									<my-admin-login-role content="admin" @toggle="toggleRoleId($event)" :module="m" :readonly="isLdapAssignedRoles" :roleIds="roleIds" />
									<my-admin-login-role content="user"  @toggle="toggleRoleId($event)" :module="m" :readonly="isLdapAssignedRoles" :roleIds="roleIds" />
									<my-admin-login-role content="other" @toggle="toggleRoleId($event)" :module="m" :readonly="isLdapAssignedRoles" :roleIds="roleIds" />
								</tr>
							</tbody>
						</table>

						<!-- properties -->
						<table class="generic-table-vertical w1200" v-if="tabTarget === 'properties'">
							<tbody>
								<tr>
									<td>
										<div class="title-cell">
											<img src="images/personCog.png" />
											<span>{{ capApp.admin }}</span>
										</div>
									</td>
									<td><my-bool v-model="admin" /></td>
									<td>{{ capApp.hint.admin }}</td>
								</tr>
								
								<!-- login records -->
								<tr v-for="(lf,lfi) in loginForms">
									<td>
										<div class="title-cell">
											<img :src="srcBase64Icon(moduleIdMap[lf.moduleId].iconId,'images/module.png')" />
											<span>{{ getCaption('loginFormTitle',lf.moduleId,lf.id,lf.captions,lf.name) }}</span>
										</div>
									</td>
									<td>
										<div class="field login-details-login-form-input">
											<div class="field-content data intent" :class="{ dropdown:loginFormIndexesDropdown.includes(lfi) }">
												<my-input-select
													@dropdown-show="openLoginFormDropdown(lfi,$event)"
													@open="openLoginForm(lfi)"
													@request-data="getRecords(lfi)"
													@updated-text-input="recordInput = $event"
													@update:selected="updateLoginRecord(lfi,$event)"
													:dropdownShow="loginFormIndexesDropdown.includes(lfi)"
													:nakedIcons="true"
													:options="recordList"
													:placeholder="capGen.threeDots"
													:selected="records[lfi].id"
													:showOpen="true"
													:inputTextSet="records[lfi].label"
												/>
											</div>
										</div>
									</td>
									<td></td>
								</tr>
								
								<tr>
									<td>
										<div class="title-cell">
											<img src="images/remove.png" />
											<span>{{ capGen.active }}</span>
										</div>
									</td>
									<td><my-bool v-model="active" /></td>
									<td>{{ capApp.hint.active }}</td>
								</tr>
								<tr>
									<td>
										<div class="title-cell">
											<img src="images/globe.png" />
											<span>{{ capApp.noAuth }}</span>
										</div>
									</td>
									<td><my-bool v-model="noAuth" :readonly="isLdap" /></td>
									<td>
										<div class="column gap default-inputs">
											<span>{{ capApp.hint.noAuth }}</span>
											<div class="row gap centered" v-if="noAuth">
												<input disabled :value="noAuthUrl" />
												<my-button image="copyClipboard.png"
													@trigger="copyToClipboard"
													:captionTitle="capGen.button.copyClipboard"
												/>
											</div>
										</div>
									</td>
								</tr>
								<tr>
									<td>
										<div class="title-cell">
											<img src="images/clock.png" />
											<span>{{ capApp.tokenExpiryHours }}</span>
										</div>
									</td>
									<td class="default-inputs">
										<input v-model="tokenExpiryHours" />
									</td>
									<td>{{ capApp.hint.tokenExpiryHours }}</td>
								</tr>

								<tr v-if="anyAction"><td colspan="3" class="grouping">{{ capGen.actions }}</td></tr>
								<tr v-if="!isLdap">
									<td>
										<div class="title-cell">
											<img src="images/lock.png" />
											<span>{{ capApp.password }}</span>
										</div>
									</td>
									<td class="default-inputs">
										<input type="password" v-model="pass" :placeholder="capGen.threeDots" />
									</td>
									<td>{{ capApp.hint.password }}</td>
								</tr>

								<tr v-if="anyInfo"><td colspan="3" class="grouping">{{ capGen.information }}</td></tr>
								<tr v-if="isLimited">
									<td>
										<div class="title-cell">
											<img src="images/personDot.png" />
											<span>{{ capApp.limited }}</span>
										</div>
									</td>
									<td colspan="2"><span v-html="capApp.limitedDesc"></span></td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	</div>`,
	props:{
		ldaps:           { type:Array,  required:true },
		loginId:         { type:Number, required:true }, // login ID from parent, 0 if new
		loginForms:      { type:Array,  required:true },
		loginFormLookups:{ type:Array,  required:true }
	},
	emits:['close'],
	data() {
		return {
			// inputs
			id:0,
			ldapId:null,
			ldapKey:null,
			active:true,
			admin:false,
			meta:{},
			name:'',
			noAuth:false,
			pass:'',
			tokenExpiryHours:'',
			records:[],
			roleIds:[],
			templateId:null,
			
			// states
			notUniqueEmail:false,
			notUniqueName:false,
			inputKeys:['name','active','admin','pass','meta','noAuth','tokenExpiryHours','records','roleIds'],
			inputsOrg:{},      // map of original input values, key = input key
			inputsReady:false, // inputs have been loaded
			recordInput:'',    // record lookup input
			recordList:[],     // record lookup dropdown values
			roleFilter:'',     // filter for role selection
			tabTarget:'meta',
			templates:[],      // login templates
			timerNotUniqueCheck:null,
			
			// login form
			loginFormIndexesDropdown:[],
			loginFormIndexOpen:null,
			loginFormRecords:null
		};
	},
	computed:{
		hasChanges:(s) => {
			if(!s.inputsReady)
				return false;
			
			for(let k of s.inputKeys) {
				if(JSON.stringify(s.inputsOrg[k]) !== JSON.stringify(s[k]))
					return true;
			}
			return false;
		},
		isLdapAssignedRoles:(s) => {
			if(s.ldapId === null)
				return false;
			
			for(let l of s.ldaps) {
				if(l.id === s.ldapId)
					return l.assignRoles;
			}
			return false;
		},
		roleTotalNonHidden:(s) => {
			let cnt = 0;
			for(let roleId of s.roleIds) {
				if(!s.moduleIdMapMeta[s.roleIdMap[roleId].moduleId].hidden)
					cnt++
			}
			return cnt;
		},
		modulesFiltered:(s) => s.modules.filter(v => !s.moduleIdMapMeta[v.id].hidden &&
			(s.roleFilter === '' || s.getCaption('moduleTitle',v.id,v.id,v.captions,v.name).toLowerCase().includes(s.roleFilter.toLowerCase()))),
		
		// simple states
		anyAction: (s) => !s.isLdap,
		anyInfo:   (s) => s.isLimited,
		canSave:   (s) => s.hasChanges && !s.notUniqueName && s.name !== '',
		isFormOpen:(s) => s.loginFormIndexOpen !== null,
		isLdap:    (s) => s.ldapId !== null,
		isLimited: (s) => s.activated && s.roleIds.length < 2 && !s.admin && !s.noAuth,
		isNew:     (s) => s.id === 0,
		noAuthUrl: (s) => !s.noAuth ? '' : `${location.protocol}//${location.host}/#/?login=${s.name}`,
		
		// stores
		activated:      (s) => s.$store.getters['local/activated'],
		modules:        (s) => s.$store.getters['schema/modules'],
		moduleIdMap:    (s) => s.$store.getters['schema/moduleIdMap'],
		formIdMap:      (s) => s.$store.getters['schema/formIdMap'],
		roleIdMap:      (s) => s.$store.getters['schema/roleIdMap'],
		capApp:         (s) => s.$store.getters.captions.admin.login,
		capGen:         (s) => s.$store.getters.captions.generic,
		moduleIdMapMeta:(s) => s.$store.getters.moduleIdMapMeta
	},
	mounted() {
		window.addEventListener('keydown',this.handleHotkeys);
		this.id = this.loginId;
		this.getTemplates();
		
		// existing login, get values
		if(this.id !== 0)
			return this.get();
		
		// new login, set defaults
		for(let lf of this.loginForms) {
			this.records.push({id:null,label:''});
		}
		this.inputsLoaded();
	},
	unmounted() {
		window.removeEventListener('keydown',this.handleHotkeys);
	},
	methods:{
		// externals
		dialogCloseAsk,
		getCaption,
		getLoginIcon,
		srcBase64Icon,
		
		handleHotkeys(e) {
			if(e.ctrlKey && e.key === 's') {
				if(this.canSave)
					this.set();
				
				e.preventDefault();
			}
			if(e.key === 'Escape' && !this.isFormOpen) {
				this.closeAsk();
				e.preventDefault();
			}
		},
		inputsLoaded() {
			for(let k of this.inputKeys) {
				this.inputsOrg[k] = JSON.parse(JSON.stringify(this[k]));
			}
			this.inputsReady = true;
		},
		
		// actions
		closeAsk() {
			this.dialogCloseAsk(this.close,this.hasChanges);
		},
		close() {
			this.$emit('close');
		},
		copyToClipboard() {
			navigator.clipboard.writeText(this.noAuthUrl);
		},
		openLoginForm(index) {
			const frm = this.formIdMap[this.loginForms[index].formId];
			const mod = this.moduleIdMap[frm.moduleId];
			
			this.loginFormIndexOpen = index;
			this.loginFormRecords   = this.records[index].id !== null
				? [this.records[index].id] : [];
		},
		openLoginFormDropdown(index,state) {
			const pos = this.loginFormIndexesDropdown.indexOf(index);
			if(pos === -1 && state)  this.loginFormIndexesDropdown.push(index);
			if(pos !== -1 && !state) this.loginFormIndexesDropdown.splice(pos,1);
		},
		reset() {
			this.id             = 0;
			this.name           = '';
			this.notUniqueEmail = false;
			this.notUniqueName  = false;
			this.getIsNotUnique('email',this.meta.email);
		},
		toggleRoleId(roleId) {
			const pos = this.roleIds.indexOf(roleId);
			if(pos === -1) this.roleIds.push(roleId);
			else           this.roleIds.splice(pos,1);
		},
		toggleRolesByContent(content) {
			let roleIdsByContent = [];
			for(let i = 0, j = this.modules.length; i < j; i++) {
				for(let x = 0, y = this.modules[i].roles.length; x < y; x++) {
					let r = this.modules[i].roles[x];
					
					if(r.assignable && r.content === content)
						roleIdsByContent.push(r.id);
				}
			}
			
			// has all roles, remove all
			if(roleIdsByContent.length === this.roleIds.filter(v => roleIdsByContent.includes(v)).length) {
				for(let i = 0, j = roleIdsByContent.length; i < j; i++) {
					this.roleIds.splice(this.roleIds.indexOf(roleIdsByContent[i]),1);
				}
				return;
			}
			
			// does not have all roles, add missing
			for(let i = 0, j = roleIdsByContent.length; i < j; i++) {
				if(!this.roleIds.includes(roleIdsByContent[i]))
					this.roleIds.push(roleIdsByContent[i]);
			}
		},
		typedUniqueField(content,value) {
			clearInterval(this.timerNotUniqueCheck);
			this.timerNotUniqueCheck = setTimeout(() => this.getIsNotUnique(content,value),750);
		},
		updateLoginRecord(loginFormIndex,recordId) {
			this.recordInput = '';
			this.records[loginFormIndex].id = recordId;
			
			if(recordId !== null) this.getRecords(loginFormIndex);
			else                  this.records[loginFormIndex].label = '';
		},
		
		// backend calls
		delAsk() {
			this.$store.commit('dialog',{
				captionBody:this.capApp.dialog.delete,
				buttons:[{
					cancel:true,
					caption:this.capGen.button.delete,
					exec:this.del,
					image:'delete.png'
				},{
					caption:this.capGen.button.cancel,
					image:'cancel.png'
				}]
			});
		},
		del() {
			ws.send('login','del',{id:this.id},true).then(
				() => {
					ws.send('login','kick',{id:this.id},true).then(
						() => this.$emit('close'),
						this.$root.genericError
					);
				},
				this.$root.genericError
			);
		},
		get() {
			ws.send('login','get',{
				byId:this.id,
				meta:true,
				roles:true,
				recordRequests:this.loginFormLookups
			},true).then(
				res => {
					if(res.payload.logins.length !== 1) return;
					
					let login = res.payload.logins[0];
					this.ldapId           = login.ldapId;
					this.ldapKey          = login.ldapKey;
					this.name             = login.name;
					this.active           = login.active;
					this.admin            = login.admin;
					this.meta             = login.meta;
					this.noAuth           = login.noAuth;
					this.tokenExpiryHours = login.tokenExpiryHours;
					this.records          = login.records;
					this.roleIds          = login.roleIds;
					this.pass             = '';
					this.inputsLoaded();
					this.getIsNotUnique('email',this.meta.email);
				},
				this.$root.genericError
			);
		},
		getIsNotUnique(content,value) {
			value = value.trim().toLowerCase();
			if(value === '')
				return;

			ws.send('login','getIsNotUnique',{
				loginId:this.id,
				content:content,
				value:value
			},true).then(
				res => {
					switch(content) {
						case 'email': this.notUniqueEmail = res.payload; break
						case 'name':  this.notUniqueName  = res.payload; break;
					}
				},
				this.$root.genericError
			);
		},
		getRecords(loginFormIndex) {
			this.recordList = [];
			let isIdLookup = this.records[loginFormIndex].id !== null;
			
			ws.send('login','getRecords',{
				attributeIdLookup:this.loginForms[loginFormIndex].attributeIdLookup,
				byId:isIdLookup ? this.records[loginFormIndex].id : 0,
				byString:isIdLookup ? '' : this.recordInput
			},true).then(
				res => {
					if(!isIdLookup)
						return this.recordList = res.payload;
					
					if(res.payload.length === 1)
						this.records[loginFormIndex].label = res.payload[0].name;
				},
				this.$root.genericError
			);
		},
		getTemplates() {
			ws.send('loginTemplate','get',{byId:0},true).then(
				res => {
					this.templates = res.payload;
					
					// apply global template if empty
					if(this.templateId === null && this.templates.length > 0)
						this.templateId = this.templates[0].id;
				},
				this.$root.genericError
			);
		},
		set() {
			let records = [];
			for(let i = 0, j = this.loginForms.length; i < j; i++) {
				records.push({
					attributeId:this.loginForms[i].attributeIdLogin,
					recordId:this.records[i].id
				});
			}
			
			ws.send('login','set',{
				id:this.id,
				ldapId:this.ldapId,
				ldapKey:this.ldapKey,
				name:this.name,
				pass:this.pass,
				active:this.active,
				admin:this.admin,
				meta:this.meta,
				noAuth:this.noAuth,
				tokenExpiryHours:/^(0|[1-9]\d*)$/.test(this.tokenExpiryHours) ? parseInt(this.tokenExpiryHours) : null,
				roleIds:this.roleIds,
				records:records,
				templateId:this.templateId
			},true).then(
				res => {
					// if login was changed, reauth. or kick client
					if(!this.isNew)
						ws.send('login',this.active ? 'reauth' : 'kick',{id:this.id},false);
					
					if(this.isNew)
						this.id = res.payload;
					
					this.get();
				},
				this.$root.genericError
			);
		},
		
		// MFA calls
		resetTotpAsk() {
			this.$store.commit('dialog',{
				captionBody:this.capApp.dialog.resetTotp,
				image:'warning.png',
				buttons:[{
					cancel:true,
					caption:this.capGen.button.reset,
					exec:this.resetTotp,
					keyEnter:true,
					image:'refresh.png'
				},{
					caption:this.capGen.button.cancel,
					keyEscape:true,
					image:'cancel.png'
				}]
			});
		},
		resetTotp() {
			ws.send('login','resetTotp',{id:this.id},true).then(
				res => {},this.$root.genericError
			);
		}
	}
};