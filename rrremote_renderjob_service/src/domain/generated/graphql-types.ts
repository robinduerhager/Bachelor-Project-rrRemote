import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
  _FieldSet: any,
};






export type Artist = {
   __typename?: 'Artist',
  uid: Scalars['String'],
  renderjobs: Array<Renderjob>,
};

export type Mutation = {
   __typename?: 'Mutation',
  createRenderjob: Storage,
  submit: Scalars['Boolean'],
};


export type MutationCreateRenderjobArgs = {
  title: Scalars['String']
};


export type MutationSubmitArgs = {
  renderjobID: Scalars['ID']
};

export type Query = {
   __typename?: 'Query',
  renderjob: Renderjob,
};


export type QueryRenderjobArgs = {
  id: Scalars['ID']
};

export type Renderjob = {
   __typename?: 'Renderjob',
  id: Scalars['ID'],
  title: Scalars['String'],
  remainingTime: Scalars['Int'],
  artist: Artist,
  status: Scalars['String'],
  storage: Storage,
};

export type Storage = {
   __typename?: 'Storage',
  bucketName: Scalars['String'],
  fileName: Scalars['String'],
};



export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type ReferenceResolver<TResult, TReference, TContext> = (
      reference: TReference,
      context: TContext,
      info: GraphQLResolveInfo
    ) => Promise<TResult> | TResult;

export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

export type isTypeOfResolverFn<T = {}> = (obj: T, info: GraphQLResolveInfo) => boolean;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Query: ResolverTypeWrapper<{}>,
  ID: ResolverTypeWrapper<Scalars['ID']>,
  Renderjob: ResolverTypeWrapper<Renderjob>,
  String: ResolverTypeWrapper<Scalars['String']>,
  Int: ResolverTypeWrapper<Scalars['Int']>,
  Artist: ResolverTypeWrapper<Artist>,
  Storage: ResolverTypeWrapper<Storage>,
  Mutation: ResolverTypeWrapper<{}>,
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>,
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {},
  ID: Scalars['ID'],
  Renderjob: Renderjob,
  String: Scalars['String'],
  Int: Scalars['Int'],
  Artist: Artist,
  Storage: Storage,
  Mutation: {},
  Boolean: Scalars['Boolean'],
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  renderjob?: Resolver<ResolversTypes['Renderjob'], ParentType, ContextType, RequireFields<QueryRenderjobArgs, 'id'>>,
};

export type RenderjobResolvers<ContextType = any, ParentType extends ResolversParentTypes['Renderjob'] = ResolversParentTypes['Renderjob']> = {
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Renderjob']>, { __typename: 'Renderjob' } & Pick<ParentType, 'id'>, ContextType>,
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  remainingTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  artist?: Resolver<ResolversTypes['Artist'], ParentType, ContextType>,
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  storage?: Resolver<ResolversTypes['Storage'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type ArtistResolvers<ContextType = any, ParentType extends ResolversParentTypes['Artist'] = ResolversParentTypes['Artist']> = {
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Artist']>, { __typename: 'Artist' } & Pick<ParentType, 'uid'>, ContextType>,

  renderjobs?: Resolver<Array<ResolversTypes['Renderjob']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type StorageResolvers<ContextType = any, ParentType extends ResolversParentTypes['Storage'] = ResolversParentTypes['Storage']> = {
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Storage']>, { __typename: 'Storage' } & Pick<ParentType, 'bucketName' | 'fileName'>, ContextType>,
  bucketName?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  fileName?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createRenderjob?: Resolver<ResolversTypes['Storage'], ParentType, ContextType, RequireFields<MutationCreateRenderjobArgs, 'title'>>,
  submit?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSubmitArgs, 'renderjobID'>>,
};

export type Resolvers<ContextType = any> = {
  Query?: QueryResolvers<ContextType>,
  Renderjob?: RenderjobResolvers<ContextType>,
  Artist?: ArtistResolvers<ContextType>,
  Storage?: StorageResolvers<ContextType>,
  Mutation?: MutationResolvers<ContextType>,
};


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
*/
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
